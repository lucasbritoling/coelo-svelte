<script lang="ts">
	import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { dateUtils } from '$lib/utils/date';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { LoaderCircle, ArrowLeft, ArrowRight, CalendarDays, Clock } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { Appointment } from '$lib/types/appointment';

	let { open = $bindable(false), appt }: { open: boolean; appt: Appointment } = $props();

	// ── Passos do Reagendamento ──────────────────────────────────────
	type StepId = 'date' | 'time' | 'confirm';
	const steps: StepId[] = ['date', 'time', 'confirm'];
	let stepIndex = $state(0);
	const currentStep = $derived(steps[stepIndex]);

	let calendarValue = $state(page.data.selectedDate ? parseDate(page.data.selectedDate) : null);
	let selectedTime = $state<string | null>(null);
	let isLoading = $state(false);

	// ── Utilitários de Tempo de alta performance ────────────────────
	const timeToMins = (t: string) => {
		const [h, m] = t.split(':').map(Number);
		return h * 60 + m;
	};

	const minsToTime = (m: number) => {
		return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
	};

	// Duração em minutos do agendamento atual
	const apptDuration = $derived(timeToMins(appt.end_at) - timeToMins(appt.start_at));
	const dateLabel = $derived(dateUtils.getHeaderLabel(page.data.selectedDate, page.data.timezone));

	// ── CÁLCULO CIRÚRGICO DE SLOTS LIVRES PARA O DIALOG ───────────────
	const availableSlots = $derived.by(() => {
		const appointments = page.data.appointments || [];
		const workingHours = page.data.workingHours || [];
		const selectedDate = page.data.selectedDate;
		const timezone = page.data.timezone;

		const dayOfWeek = dateUtils.parseISO(selectedDate).getDay();
		const currentDayConfig = workingHours.find((wh: any) => wh.day_of_week === dayOfWeek);

		const slots: string[] = [];

		if (currentDayConfig && currentDayConfig.is_active) {
			const dayStart = timeToMins(currentDayConfig.start_time);
			const dayEnd = timeToMins(currentDayConfig.end_time);
			const step = page.data.favoriteGhostSlotInterval || 30;

			// Filtra agendamentos ativos desconsiderando o próprio agendamento atual (assim ele pode se mover no mesmo dia)
			const activeAppts = appointments
				.filter((a: any) => a.status !== 'cancelled' && a.id !== appt.id)
				.sort((a: any, b: any) => a.start_at.localeCompare(b.start_at));

			let current = dayStart;
			const nowTimeStr = dateUtils.toTime(Date.now(), timezone);
			const isToday = selectedDate === dateUtils.today(timezone);

			while (current + apptDuration <= dayEnd) {
				const slotStart = current;
				const slotEnd = current + apptDuration;

				// Valida se esta janela colide com outro agendamento na linha do tempo
				const hasOverlap = activeAppts.some((a: any) => {
					const aStart = timeToMins(a.start_at);
					const aEnd = timeToMins(a.end_at);
					return slotStart < aEnd && slotEnd > aStart;
				});

				const timeStr = minsToTime(slotStart);
				const isPastSlot = isToday && timeStr < nowTimeStr;

				if (!hasOverlap && !isPastSlot) {
					slots.push(timeStr);
				}
				current += step;
			}
		}
		return slots;
	});

	const canAdvance = $derived(
		currentStep === 'date'
			? !!page.data.selectedDate
			: currentStep === 'time'
				? !!selectedTime
				: false
	);

	function goNext() {
		if (!canAdvance) return;
		if (stepIndex < steps.length - 1) stepIndex++;
	}

	function goBack() {
		if (stepIndex > 0) {
			stepIndex--;
			selectedTime = null;
		}
	}

	async function updateDate(date: string) {
		selectedTime = null;
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', date);
		await goto(newUrl.search, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function isDateDisabled(date: any) {
		const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
		const todayStr = dateUtils.today(page.data.timezone);
		if (dateString < todayStr) return true;

		const d = dateUtils.parseISO(dateString);
		const currentDayConfig = page.data.workingHours?.find(
			(wh: any) => wh.day_of_week === d.getDay()
		);
		return !currentDayConfig || !currentDayConfig.is_active;
	}

	$effect(() => {
		if (!open) {
			stepIndex = 0;
			selectedTime = null;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-sm rounded-xl">
		<Dialog.Header>
			<Dialog.Title class="text-center text-base font-bold">Reagendar Horário</Dialog.Title>
		</Dialog.Header>

		<div class="my-1 flex items-center justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={goBack}
				class="h-8 cursor-pointer px-3 text-xs {stepIndex === 0 ? 'invisible' : ''}"
			>
				<ArrowLeft class="mr-1 size-3.5" /> Voltar
			</Button>

			<div class="flex items-center gap-1.5">
				{#each steps as _, i}
					<div
						class="h-1.5 rounded-full transition-all duration-200
                        {i === stepIndex
							? 'w-5 bg-foreground'
							: i < stepIndex
								? 'w-1.5 bg-foreground/40'
								: 'w-1.5 bg-border'}"
					></div>
				{/each}
			</div>

			{#if currentStep !== 'confirm'}
				<Button
					size="sm"
					onclick={goNext}
					disabled={!canAdvance}
					class="h-8 cursor-pointer px-3 text-xs"
				>
					Avançar <ArrowRight class="ml-1 size-3.5" />
				</Button>
			{:else}
				<div class="w-[72px]"></div>
			{/if}
		</div>

		<div
			class="flex min-h-8 flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
		>
			{#if page.data.selectedDate}
				<span class="flex items-center gap-1">
					<CalendarDays class="size-3" />
					<strong class="font-medium text-foreground">{dateLabel}</strong>
				</span>
			{/if}
			{#if selectedTime}
				<span class="text-border">·</span>
				<span class="flex items-center gap-1">
					<Clock class="size-3" />
					<strong class="font-medium text-foreground">{selectedTime}</strong>
				</span>
			{/if}
		</div>

		{#if currentStep === 'date'}
			<Calendar
				bind:value={calendarValue}
				fixedWeeks
				{isDateDisabled}
				onValueChange={(v) => v && updateDate(v.toString())}
				class="w-full rounded-xl border"
				minValue={today(getLocalTimeZone())}
			/>
		{:else if currentStep === 'time'}
			{#if availableSlots.length === 0}
				<p class="py-12 text-center text-sm text-muted-foreground">
					Nenhuma janela de {apptDuration} min livre para este dia.
				</p>
			{:else}
				<div class="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto p-0.5">
					{#each availableSlots as slot}
						<Button
							variant={selectedTime === slot ? 'default' : 'outline'}
							class="h-10 cursor-pointer text-xs font-semibold"
							onclick={() => (selectedTime = slot)}
						>
							{slot}
						</Button>
					{/each}
				</div>
			{/if}
		{:else if currentStep === 'confirm'}
			<form
				method="POST"
				action="?/reschedule"
				use:enhance={() => {
					isLoading = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							toast.success('Agendamento reagendado com sucesso!');
							open = false;
							await update();
						} else if (result.type === 'failure') {
							toast.error(result.data?.message || 'Erro ao reagendar.');
						}
						isLoading = false;
					};
				}}
				class="flex flex-col gap-4 py-1"
			>
				<input type="hidden" name="id" value={appt.id} />
				<input type="hidden" name="date" value={page.data.selectedDate} />
				<input type="hidden" name="start_at" value={selectedTime} />
				<input
					type="hidden"
					name="end_at"
					value={selectedTime ? minsToTime(timeToMins(selectedTime) + apptDuration) : ''}
				/>

				<div
					class="space-y-1 rounded-xl border bg-muted/20 p-4 text-center text-sm text-muted-foreground"
				>
					<p>Confirmar alteração de <b>{appt.customer_name}</b> para:</p>
					<p class="text-base font-bold text-foreground">{dateLabel}</p>
					<p class="text-base font-bold text-foreground">às {selectedTime} ({apptDuration} min)</p>
				</div>

				<Button type="submit" class="w-full cursor-pointer" disabled={isLoading}>
					{#if isLoading}<LoaderCircle class="mr-2 size-4 animate-spin" />{/if}
					Confirmar Reagendamento
				</Button>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
