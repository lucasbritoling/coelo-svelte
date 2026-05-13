<script lang="ts">
	import { dateUtils } from '$lib/utils/date';
	import { ui as globalUI } from '$lib/state/ui.svelte';
	import type { Appointment } from '$lib/types/appointment';
	import { Check, CalendarDays, Link, CalendarPlus } from '@lucide/svelte';

	import * as Dialog from '$lib/components/ui/dialog';

	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import AgendaHeader from '$lib/components/app/agenda/agenda-header.svelte';
	import AgendaStrip from '$lib/components/app/agenda/agenda-strip.svelte';
	import AppointmentForm from '$lib/components/app/new-appointment-form.svelte';
	import AppointmentCard from '$lib/components/app/agenda/appointment-card.svelte';
	import GhostSlot from '$lib/components/app/agenda/ghost-slot.svelte';
	import { scale } from 'svelte/transition';

	let { data } = $props<{
		data: {
			appointments: Appointment[];
			username: string;
			selectedDate: string;
			customers: any[];
			services: any[];
			user: any;
		};
	}>();

	// ── Lógica de Tempo ──────────────────────────────────────────
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

	// Reatividade baseada na Lib centralizada
	const reactiveNow = $derived(dateUtils.toTime(ticker));
	const isTodayView = $derived(data.selectedDate === dateUtils.today());
	const headerLabel = $derived(dateUtils.getHeaderLabel(data.selectedDate));

	// ── Navegação ────────────────────────────────────────────────
	function updateDate(newDate: string) {
		if (!newDate || newDate === data.selectedDate) return;
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', newDate);
		goto(newUrl.search, { replaceState: true, noScroll: true });
	}

	function navigateDay(offset: number) {
		const date = dateUtils.parseISO(data.selectedDate);
		date.setDate(date.getDate() + offset);
		updateDate(dateUtils.fmt.iso.format(date));
	}

	let touchStartX = 0;
	function handleTouchEnd(e: TouchEvent) {
		const dx = touchStartX - e.changedTouches[0].screenX;
		if (Math.abs(dx) > 80) navigateDay(dx > 0 ? 1 : -1);
	}

	// ── Organização de Grupos ────────────────────────────────────
	const groups = $derived.by(() => {
		const appointments = activeApps; // Apenas os confirmados/concluídos
		if (!isTodayView) return { past: [], next: null, later: appointments };

		const past = appointments.filter((a) => a.start_at < reactiveNow);
		const upcoming = appointments.filter((a) => a.start_at >= reactiveNow);

		const next = upcoming[0] || null;
		const laterRaw = upcoming.slice(1);

		// Injetar Vácuos na lista "Later"
		const laterWithGaps = [];
		for (let i = 0; i < laterRaw.length; i++) {
			const current = laterRaw[i];
			const prev = i === 0 ? next : laterRaw[i - 1];

			if (prev) {
				const gapMinutes = calculateGap(prev.end_at, current.start_at);
				if (gapMinutes >= 30) {
					laterWithGaps.push({ type: 'gap', duration: gapMinutes, start_at: prev.end_at });
				}
			}
			laterWithGaps.push({ ...current, type: 'appointment' });
		}

		return { past, next, later: laterWithGaps };
	});

	// NOVOS
	// Filtros de Status (Cemitério e Pendentes)
	const pendingApps = $derived(data.appointments.filter((a) => a.status === 'pending'));
	const cancelledApps = $derived(data.appointments.filter((a) => a.status === 'cancelled'));

	// Filtro de Agendamentos Ativos (Confirmados/Concluídos)
	const activeApps = $derived(
		data.appointments.filter((a) => a.status !== 'pending' && a.status !== 'cancelled')
	);

	// Helper para decidir quando mostrar o divisor de período
	function getPeriod(time: string) {
		const hour = parseInt(time.split(':')[0]);
		if (hour < 12) return 'MANHÃ';
		if (hour < 18) return 'TARDE';
		return 'NOITE';
	}

	function calculateGap(end: string, nextStart: string) {
		const [h1, m1] = end.split(':').map(Number);
		const [h2, m2] = nextStart.split(':').map(Number);
		return h2 * 60 + m2 - (h1 * 60 + m1);
	}
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

	<div class="flex-1 space-y-8 overflow-y-auto px-4 pt-4 pb-20">
		{#if data.appointments.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center">
				<div class="mb-4 rounded-full bg-zinc-100 p-4 text-zinc-400">
					<CalendarDays size={32} />
				</div>
				<p class="font-medium text-zinc-500">Nenhum agendamento</p>
				<button
					onclick={() => (ui.modal = true)}
					class="mt-4 text-sm font-bold text-zinc-900 underline underline-offset-4"
				>
					Criar um agora
				</button>
			</div>
		{:else}
			{#if pendingApps.length > 0}
				<section class="space-y-3">
					<p class="px-2 text-[10px] font-bold tracking-[0.2em] text-amber-600 uppercase">
						Solicitações
					</p>
					<div class="flex flex-col gap-2">
						{#each pendingApps as appt}
							<AppointmentCard {appt} highlighted={true} />
						{/each}
					</div>
				</section>
			{/if}

			{#if groups.past.length > 0}
				<section class="space-y-3">
					<p class="px-2 text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
						Anteriores
					</p>
					<div class="flex flex-col gap-2">
						{#each groups.past as appt}
							<AppointmentCard {appt} dimmed={true} />
						{/each}
					</div>
				</section>
			{/if}

			{#if groups.next}
				<section class="space-y-3">
					<p class="px-2 text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">Agora</p>
					<AppointmentCard
						appt={groups.next}
						highlighted={true}
						soon={dateUtils.getSoonLabel(groups.next.start_at, ticker)}
					/>
				</section>
			{/if}

			{#if groups.later.length > 0}
				<section class="space-y-6">
					{#each groups.later as item, i}
						{#if item.type === 'appointment'}
							{@const currentPeriod = getPeriod(item.start_at)}
							{@const prevItem = groups.later[i - 1]}
							{@const prevPeriod = prevItem
								? getPeriod(prevItem.start_at)
								: groups.next
									? getPeriod(groups.next.start_at)
									: null}

							{#if currentPeriod !== prevPeriod}
								<div class="flex items-center gap-4 px-2 pt-2">
									<span class="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
										{currentPeriod}
									</span>
									<div class="h-px flex-1 bg-zinc-100"></div>
								</div>
							{/if}

							<AppointmentCard appt={item} />
						{:else}
							<GhostSlot
								duration={item.duration}
								startAt={item.start_at}
								onclick={() => {
									selectedTime = item.start_at;
									ui.modal = true;
								}}
							/>
						{/if}
					{/each}
				</section>
			{/if}

			{#if cancelledApps.length > 0 && data.user?.show_cancelled}
				<section class="mt-12 space-y-3 border-t border-dashed border-zinc-200 pt-8">
					<p class="px-2 text-[10px] font-bold tracking-[0.2em] text-zinc-300 uppercase">
						Cancelados
					</p>
					<div class="flex flex-col gap-2">
						{#each cancelledApps as appt}
							<div class="opacity-30 grayscale">
								<AppointmentCard {appt} />
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/if}

		<!-- FABs: Link e Novo Agendamento -->
		<div class="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2">
			<!-- Botão: Copiar Link -->
			<div class="flex flex-col items-end gap-2">
				{#if ui.copied}
					<span
						transition:scale={{ duration: 150 }}
						class="rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-white shadow-xl"
					>
						LINK COPIADO!
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

			<!-- Botão: Novo Agendamento (Idêntico ao de cima) -->
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

<AppointmentForm
	{data}
	bind:open={ui.modal}
	initialTime={selectedTime}
	onSuccess={() => {
		selectedTime = ''; // Limpa o horário sugerido após sucesso
		// O modal fecha sozinho pelo bind:open interno ou pelo onSuccess
	}}
/>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
