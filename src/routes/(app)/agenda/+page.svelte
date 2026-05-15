<script lang="ts">
	import { dateUtils } from '$lib/utils/date';
	import { ui as globalUI } from '$lib/state/ui.svelte';
	import type { Appointment } from '$lib/types/appointment';
	import { Check, CalendarDays, Link, CalendarPlus } from '@lucide/svelte';

	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import AgendaHeader from '$lib/components/app/agenda/agenda-header.svelte';
	import AgendaStrip from '$lib/components/app/agenda/agenda-strip.svelte';
	import AppointmentForm from '$lib/components/app/agenda/appointment-form.svelte';
	import AppointmentItem from '$lib/components/app/agenda/appointment-item.svelte';
	import { scale } from 'svelte/transition';

	// ── Props com Svelte 5 Runes ──────────────────────────────────
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

	// ── Lógica de Tempo & Ticker ──────────────────────────────────
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

	// ── Estado de UI Local ────────────────────────────────────────
	let ui = $state({ modal: false, copied: false });
	let selectedTime = $state('');

	$effect(() => {
		globalUI.isModalOpen = ui.modal;
	});

	// ── Dados Derivados (Reatividade Limpa) ───────────────────────
	const schedulingLink = $derived(`coelo.dev/${data.username}`);
	const headerLabel = $derived(dateUtils.getHeaderLabel(data.selectedDate));

	// Define se exibe a barra lateral de cor (Apenas se houver mais de 1 serviço no array do dia)
	const showServiceColor = $derived(new Set(data.appointments.map((a) => a.service_id)).size > 1);

	// ── Navegação de Datas ────────────────────────────────────────
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

	// Gestos de Swipe
	let touchStartX = 0;
	function handleTouchEnd(e: TouchEvent) {
		const dx = touchStartX - e.changedTouches[0].screenX;
		if (Math.abs(dx) > 80) navigateDay(dx > 0 ? 1 : -1);
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

	<div class="flex-1 space-y-2 overflow-y-auto px-4 pt-4 pb-20">
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
			<!-- Renderização Cronológica Direta e Simplificada -->
			<div class="flex flex-col gap-1.5">
				{#each data.appointments as appt (appt.id)}
					<AppointmentItem
						{appt}
						{showServiceColor}
						soon={dateUtils.getSoonLabel(appt.start_at, ticker)}
					/>
				{/each}
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

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
