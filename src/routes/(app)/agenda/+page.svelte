<script lang="ts">
	import { dateUtils } from '$lib/utils/date';
	import { ui as globalUI } from '$lib/state/ui.svelte';
	import type { Appointment } from '$lib/types/appointment';
	import { Copy, Check, CalendarDays } from '@lucide/svelte';

	import * as Dialog from '$lib/components/ui/dialog';

	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import AgendaHeader from '$lib/components/app/agenda/agenda-header.svelte';
	import AgendaStrip from '$lib/components/app/agenda/agenda-strip.svelte';
	import AppointmentForm from '$lib/components/app/appointment-form.svelte';
	import AppointmentCard from '$lib/components/app/agenda/appointment-card.svelte';

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
		const appointments = data.appointments || [];
		if (!isTodayView) return { next: [], later: appointments, past: [] };

		const next = appointments.find((a) => a.start_at >= reactiveNow) ?? null;
		return {
			next: next ? [next] : [],
			later: appointments.filter((a) => a !== next && a.start_at >= reactiveNow),
			past: appointments.filter((a) => a.start_at < reactiveNow)
		};
	});
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
		onOpenAppointment={() => (ui.modal = true)}
		onOpenSearch={() => toast('Busca em breve!')}
	/>
	<AgendaStrip selectedDate={data.selectedDate} onSelect={updateDate} />

	<div class="flex-1 space-y-6 overflow-y-auto px-4 pb-10">
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
		{:else if isTodayView}
			{@render section('próximo', groups.next, true)}
			{@render section('mais tarde', groups.later)}
			{@render section('anteriores', groups.past, false, true)}
		{:else}
			{@render section('agendamentos', data.appointments)}
		{/if}

		<div class="pt-4">
			<div class="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
				<p class="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
					Link de agendamento
				</p>
				<p class="mt-2 truncate font-mono text-sm text-zinc-600">{schedulingLink}</p>
				<button
					onclick={() => {
						navigator.clipboard.writeText(schedulingLink);
						ui.copied = true;
						setTimeout(() => (ui.copied = false), 2000);
					}}
					class="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 text-sm font-bold transition-all active:scale-95"
				>
					{#if ui.copied}
						<Check size={16} /> Copiado!
					{:else}
						<Copy size={16} /> Copiar link
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
{#snippet section(title: string, list: Appointment[], isHighlighted = false, isDimmed = false)}
	{#if list && list.length > 0}
		<div class="space-y-3">
			<p class="px-2 text-[11px] font-bold tracking-widest text-zinc-400 uppercase">{title}</p>
			<div class="flex flex-col gap-2">
				{#each list as appt}
					<AppointmentCard
						{appt}
						highlighted={isHighlighted}
						dimmed={isDimmed}
						soon={title === 'próximo' ? dateUtils.getSoonLabel(appt.start_at, ticker) : null}
					/>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<Dialog.Root bind:open={ui.modal}>
	<Dialog.Content
		class="flex max-h-[92dvh] w-[94vw] flex-col overflow-hidden rounded-[32px] p-0 shadow-2xl"
	>
		<div class="border-b px-6 py-5">
			<h2 class="text-xl font-bold">Novo Agendamento</h2>
			<p class="text-sm text-zinc-500 capitalize">{headerLabel}</p>
		</div>
		<div class="overflow-y-auto">
			<AppointmentForm
				open={ui.modal}
				customers={data.customers}
				services={data.services}
				selectedDate={data.selectedDate}
				{data}
				onSuccess={() => (ui.modal = false)}
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
