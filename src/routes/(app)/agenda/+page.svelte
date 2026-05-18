<script lang="ts">
	import { dateUtils, createFormatters } from '$lib/utils/date';
	import { ui as globalUI } from '$lib/state/ui.svelte';
	import type { Appointment } from '$lib/types/appointment';
	import { Check, CalendarDays, Link, CalendarPlus, Coffee } from '@lucide/svelte';

	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import AgendaHeader from '$lib/components/app/agenda/agenda-header.svelte';
	import AgendaStrip from '$lib/components/app/agenda/agenda-strip.svelte';
	import AppointmentForm from '$lib/components/app/agenda/appointment-form.svelte';
	import AppointmentItem from '$lib/components/app/agenda/appointment-item.svelte';
	import RescheduleDialog from '$lib/components/app/agenda/reschedule-dialog.svelte';
	import GhostSlot from '$lib/components/app/agenda/ghost-slot.svelte';
	import { scale } from 'svelte/transition';

	let { data } = $props<{
		data: {
			appointments: Appointment[];
			username: string;
			selectedDate: string;
			customers: any[];
			services: any[];
			workingHours: any[];
			user: any;
			timezone: string;
			favoriteGhostSlotInterval: number;
		};
	}>();

	let rescheduleTarget = $state<Appointment | null>(null);
	let showRescheduleDialog = $state(false);

	function openReschedule(appt: Appointment) {
		rescheduleTarget = appt;
		showRescheduleDialog = true;
	}

	let ticker = $state(Date.now());
	$effect(() => {
		const timeout = setTimeout(
			() => {
				ticker = Date.now();
				const interval = setInterval(() => {
					ticker = Date.now();
				}, 60000);
				return () => clearInterval(interval);
			},
			60000 - (Date.now() % 60000)
		);
		return () => clearTimeout(timeout);
	});

	let ui = $state({ modal: false, copied: false });
	let selectedTime = $state('');

	$effect(() => {
		globalUI.isModalOpen = ui.modal;
	});

	const schedulingLink = $derived(`coelo.dev/${data.username}`);
	const headerLabel = $derived(dateUtils.getHeaderLabel(data.selectedDate, data.timezone));
	const showServiceColor = $derived((data.services?.length ?? 0) >= 2);
	const pendingCount = $derived(
		(data.appointments || []).filter((a) => a.status === 'pending').length
	);
	const hasAppointments = $derived(agendaItems.some((item) => item.type === 'appointment'));

	const freeSlotsCount = $derived.by(() => {
		const ghostGroup = agendaItems.find((item) => item.type === 'ghost-group');
		return ghostGroup?.type === 'ghost-group' ? ghostGroup.slots.length : 0;
	});

	function updateDate(newDate: string) {
		if (!newDate || newDate === data.selectedDate) return;
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', newDate);
		goto(newUrl.search, { replaceState: true, noScroll: true });
	}

	function navigateDay(offset: number) {
		const date = dateUtils.parseISO(data.selectedDate);
		date.setDate(date.getDate() + offset);

		const formatters = createFormatters(data.timezone);
		updateDate(formatters.iso.format(date));
	}

	let touchStartX = 0;
	function handleTouchEnd(e: TouchEvent) {
		const dx = touchStartX - e.changedTouches[0].screenX;
		if (Math.abs(dx) > 80) navigateDay(dx > 0 ? 1 : -1);
	}

	const defaultDuration = $derived.by(() => {
		if (data.services?.length === 1) return data.services[0].duration;
		return data.favoriteGhostSlotInterval ?? 30;
	});

	const timeToMins = (t: string) => {
		const [h, m] = t.split(':').map(Number);
		return h * 60 + m;
	};

	const minsToTime = (m: number) => {
		return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
	};

	// ── NOVA LÓGICA DO SOONLABEL (REGRAS 1, 2 E 3) ────────────────
	const activeAndNextAppts = $derived.by(() => {
		const isToday = data.selectedDate === dateUtils.today(data.timezone);
		if (!isToday) return { currentId: null, nextId: null };

		const validAppts = data.appointments
			.filter((a) => !['cancelled', 'concluído', 'faltou'].includes(a.status))
			.map((a) => {
				const startMs = dateUtils.parseTimeToMs(a.start_at, data.selectedDate, data.timezone);
				const endMs = dateUtils.parseTimeToMs(a.end_at, data.selectedDate, data.timezone);
				return { id: a.id, startMs, endMs };
			})
			.sort((a, b) => a.startMs - b.startMs);

		let currentId = null;
		let nextId = null;

		for (const appt of validAppts) {
			// Regra 2: "Agora" (se o ticker estiver dentro do agendamento)
			if (ticker >= appt.startMs && ticker < appt.endMs) {
				currentId = appt.id;
			}
			// Regra 3: Se já achou o "agora" ou não, pega o MAIS PRÓXIMO no futuro
			else if (appt.startMs > ticker && !nextId) {
				nextId = appt.id;
			}
		}

		return { currentId, nextId };
	});

	// Regra 1: Formatação arredondada de tempo
	function getSoonText(startMs: number, endMs: number, currentMs: number): string | null {
		if (currentMs >= startMs && currentMs < endMs) return 'agora';
		if (currentMs < startMs) {
			const diffMins = Math.ceil((startMs - currentMs) / 60000);
			if (diffMins < 60) {
				return `em ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
			} else {
				const diffHours = Math.floor(diffMins / 60);
				return `em ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
			}
		}
		return null;
	}
	// ──────────────────────────────────────────────────────────────

	const agendaItems = $derived.by(() => {
		const appointments = data.appointments || [];
		const rawItems: Array<
			| { type: 'appointment'; data: any; sortTime: string; isPast: boolean }
			| { type: 'ghost'; startAt: string; duration: number; sortTime: string }
		> = [];

		const todayStr = dateUtils.today(data.timezone);
		const isSelectedToday = data.selectedDate === todayStr;

		appointments.forEach((appt) => {
			let apptIsPast = false;
			if (['cancelled', 'concluído', 'faltou'].includes(appt.status)) {
				apptIsPast = true;
			} else if (data.selectedDate < todayStr) {
				apptIsPast = true;
			} else if (isSelectedToday) {
				const endMs = dateUtils.parseTimeToMs(appt.end_at, data.selectedDate, data.timezone);
				apptIsPast = ticker > endMs;
			}
			rawItems.push({
				type: 'appointment',
				data: appt,
				sortTime: appt.start_at,
				isPast: apptIsPast
			});
		});

		const dayOfWeek = dateUtils.parseISO(data.selectedDate).getDay();
		const currentDayConfig = data.workingHours?.find((wh) => wh.day_of_week === dayOfWeek);

		if (currentDayConfig && currentDayConfig.is_active) {
			const dayStart = timeToMins(currentDayConfig.start_time);
			const dayEnd = timeToMins(currentDayConfig.end_time);
			const slotLen = defaultDuration;

			const fillGap = (startMin: number, endMin: number) => {
				let current = startMin;
				while (current + slotLen <= endMin) {
					const timeStr = minsToTime(current);
					rawItems.push({ type: 'ghost', startAt: timeStr, duration: slotLen, sortTime: timeStr });
					current += slotLen;
				}
			};

			const activeAppts = [...appointments]
				.filter((a) => a.status !== 'cancelled')
				.sort((a, b) => a.start_at.localeCompare(b.start_at));

			if (activeAppts.length > 0) {
				const firstStart = timeToMins(activeAppts[0].start_at);
				if (firstStart > dayStart) fillGap(dayStart, firstStart);
				for (let i = 0; i < activeAppts.length - 1; i++) {
					const currentEnd = timeToMins(activeAppts[i].end_at);
					const nextStart = timeToMins(activeAppts[i + 1].start_at);
					if (nextStart > currentEnd) fillGap(currentEnd, nextStart);
				}
				const lastEnd = timeToMins(activeAppts[activeAppts.length - 1].end_at);
				if (dayEnd > lastEnd) fillGap(lastEnd, dayEnd);
			} else {
				fillGap(dayStart, dayEnd);
			}
		}

		const nowTimeStr = dateUtils.toTime(ticker, data.timezone);
		const filteredItems = rawItems.filter((item) => {
			if (item.type === 'appointment') return true;
			if (isSelectedToday) return item.startAt >= nowTimeStr;
			return data.selectedDate > todayStr;
		});

		const appointmentsOnly = filteredItems
			.filter((item) => item.type === 'appointment')
			.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

		const ghostsOnly = filteredItems
			.filter((item) => item.type === 'ghost')
			.sort((a, b) => a.sortTime.localeCompare(b.sortTime));

		const groupedItems = [...appointmentsOnly];
		if (ghostsOnly.length > 0) {
			groupedItems.push({
				type: 'ghost-group',
				sortTime: ghostsOnly[0].sortTime,
				slots: ghostsOnly.map((g) => ({ startAt: g.startAt, duration: g.duration }))
			});
		}

		return groupedItems;
	});

	const isPastDate = $derived(data.selectedDate < dateUtils.today(data.timezone));
	const isFreeDay = $derived(!isPastDate && agendaItems.length === 0);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex h-full touch-pan-y flex-col"
	ontouchstart={(e) => (touchStartX = e.changedTouches[0].screenX)}
	ontouchend={handleTouchEnd}
>
	<AgendaHeader
		{headerLabel}
		selectedDate={data.selectedDate}
		user={data.user}
		onDateSelect={(d) => updateDate(d.toString())}
		onOpenAppointment={() => {
			selectedTime = '';
			ui.modal = true;
		}}
		onOpenSearch={() => toast('Busca em breve!')}
	/>

	<AgendaStrip selectedDate={data.selectedDate} onSelect={updateDate} />

	<div class="flex-1 space-y-2 overflow-y-auto px-4 pt-4 pb-20">
		{#if pendingCount > 0}
			<div
				class="mb-3 flex items-center gap-2 px-1 text-[10px] font-semibold tracking-wider uppercase select-none"
			>
				<span class="text-amber-500">
					{pendingCount}
					{pendingCount === 1 ? 'pendente' : 'pendentes'}
				</span>
				{#if hasAppointments && agendaItems.some((item) => item.type === 'ghost-group')}
					<span class="font-normal text-zinc-300">•</span>
					<span class="text-zinc-400">horários livres</span>
				{/if}
			</div>
		{/if}

		<div class="flex flex-col gap-1.5">
			{#each agendaItems as item (item.type === 'appointment' ? item.data.id : `ghost-group-${item.sortTime}`)}
				{#if item.type === 'appointment'}
					{@const startMs = dateUtils.parseTimeToMs(
						item.data.start_at,
						data.selectedDate,
						data.timezone
					)}
					{@const endMs = dateUtils.parseTimeToMs(
						item.data.end_at,
						data.selectedDate,
						data.timezone
					)}
					<!-- Verifica se a lógica computada o aponta como o atual ou o próximo -->
					{@const isCurrentOrNext =
						activeAndNextAppts.currentId === item.data.id ||
						activeAndNextAppts.nextId === item.data.id}

					<div>
						<AppointmentItem
							appt={item.data}
							{showServiceColor}
							currentTime={ticker}
							selectedDate={data.selectedDate}
							timezone={data.timezone}
							soon={isCurrentOrNext ? getSoonText(startMs, endMs, ticker) : null}
							onReschedule={openReschedule}
						/>
					</div>
				{:else if item.type === 'ghost-group'}
					<GhostSlot
						slots={item.slots}
						onSlotClick={(time) => {
							selectedTime = time;
							ui.modal = true;
						}}
					/>
				{/if}
			{/each}
		</div>

		{#if agendaItems.length === 0}
			<div
				class="flex h-[50vh] flex-col items-center justify-center gap-2.5 text-zinc-400"
				transition:scale={{ duration: 150 }}
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 text-zinc-500 shadow-sm"
				>
					<Coffee size={20} strokeWidth={2} />
				</div>
				<p class="text-xs font-bold tracking-wider text-zinc-500 uppercase">
					{isPastDate ? 'Nada neste dia' : 'Dia livre'}
				</p>
			</div>
		{/if}

		<!-- ── FABs Flutuantes (Bottom Actions) ─────────────────────── -->
		<div class="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center">
			<div class="relative flex w-full max-w-md justify-end px-4">
				<div class="pointer-events-auto flex flex-col items-end gap-2">
					<!-- Botão: Copiar Link -->
					<div class="flex flex-col items-end gap-2">
						{#if ui.copied}
							<span
								transition:scale={{ duration: 150 }}
								class="rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-emerald-400 shadow-xl"
							>
								{schedulingLink}
							</span>
						{/if}

						<button
							onclick={() => {
								navigator.clipboard.writeText(schedulingLink);
								ui.copied = true;
								setTimeout(() => (ui.copied = false), 2000);
							}}
							class="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-lg transition-all hover:bg-zinc-50 active:scale-90"
							aria-label="Copiar link de agendamento"
						>
							{#if ui.copied}
								<Check class="text-green-600" size={20} />
							{:else}
								<Link size={20} />
							{/if}
						</button>
					</div>

					<!-- Botão: Novo Agendamento -->
					<button
						onclick={() => {
							selectedTime = '';
							ui.modal = true;
						}}
						class="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-lg transition-all hover:bg-zinc-50 active:scale-90"
						aria-label="Novo agendamento"
					>
						<CalendarPlus size={20} />
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<AppointmentForm
	{data}
	bind:open={ui.modal}
	initialTime={selectedTime}
	onSuccess={() => {
		selectedTime = '';
	}}
/>

{#if rescheduleTarget}
	<RescheduleDialog bind:open={showRescheduleDialog} appt={rescheduleTarget} />
{/if}

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
