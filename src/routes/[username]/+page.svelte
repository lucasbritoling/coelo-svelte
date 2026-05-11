<script lang="ts">
	import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		LoaderCircle,
		ArrowLeft,
		ArrowRight,
		Check,
		Scissors,
		CalendarDays,
		Clock
	} from '@lucide/svelte';

	let { data } = $props();

	const professional = $derived(data.professional);
	const services = $derived(data.services);
	const slots = $derived(data.slots);
	const multiService = $derived(services.length > 1);

	// ── Steps ────────────────────────────────────────────────────────
	type StepId = 'service' | 'date' | 'time' | 'confirm';
	const steps = $derived<StepId[]>(
		multiService ? ['service', 'date', 'time', 'confirm'] : ['date', 'time', 'confirm']
	);
	let stepIndex = $state(0);
	const currentStep = $derived(steps[stepIndex]);

	// ── Selections ───────────────────────────────────────────────────
	let selectedServiceId = $state<string | null>(multiService ? null : (services[0]?.id ?? null));
	let calendarValue = $state(data.selectedDate ? parseDate(data.selectedDate) : null);
	let selectedSlot = $state<any>(null);
	let customerName = $state('');
	let customerPhone = $state('');
	let isLoading = $state(false);

	const selectedService = $derived(services.find((s: any) => s.id === selectedServiceId));

	// ── Context bar ──────────────────────────────────────────────────
	const DAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
	const MONTHS_PT = [
		'jan',
		'fev',
		'mar',
		'abr',
		'mai',
		'jun',
		'jul',
		'ago',
		'set',
		'out',
		'nov',
		'dez'
	];

	const dateLabel = $derived(() => {
		if (!data.selectedDate) return null;
		const d = new Date(data.selectedDate + 'T12:00:00');
		return `${DAYS_PT[d.getDay()]}, ${d.getDate()} de ${MONTHS_PT[d.getMonth()]}`;
	});

	// ── Advance guard ────────────────────────────────────────────────
	const canAdvance = $derived(
		currentStep === 'service'
			? !!selectedServiceId
			: currentStep === 'date'
				? !!data.selectedDate
				: currentStep === 'time'
					? !!selectedSlot
					: currentStep === 'confirm'
						? customerName.length > 1 && customerPhone.length > 7
						: false
	);

	async function goNext() {
		if (!canAdvance) return;
		if (stepIndex < steps.length - 1) stepIndex++;
	}
	function goBack() {
		if (stepIndex > 0) {
			stepIndex--;
			selectedSlot = null;
		}
	}

	async function updateDate(date: string) {
		selectedSlot = null;
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', date);
		if (selectedServiceId) newUrl.searchParams.set('serviceId', selectedServiceId);
		await goto(newUrl.search, { keepFocus: true, noScroll: true, replaceState: true });
	}

	async function selectService(id: string) {
		selectedServiceId = id;
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('serviceId', id);
		await goto(newUrl.search, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function formatSlot(t: string) {
		return t?.slice(0, 5) ?? '';
	}
</script>

<svelte:head>
	<title>Agendar com {professional.full_name}</title>
</svelte:head>

{#if data.uiState === 'unavailable'}
	<!-- mantém o estado indisponível como estava -->
{:else}
	<div class="mx-auto max-w-md px-4 pb-24">
		<!-- HEADER (inalterado) -->
		<header class="mb-6 pt-6 text-center">
			<div class="mx-auto mb-3 size-20 overflow-hidden rounded-full border bg-muted shadow-sm">
				{#if professional.avatar_url}
					<img
						src={professional.avatar_url}
						alt={professional.full_name}
						class="h-full w-full object-cover"
					/>
				{/if}
			</div>
			<h1 class="text-2xl font-bold tracking-tight">{professional.full_name}</h1>
			<p class="text-sm text-muted-foreground">@{professional.username}</p>
		</header>

		<!-- STEPPER NAV -->
		<div class="mb-3 flex items-center justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={goBack}
				class="h-8 px-3 text-xs {stepIndex === 0 ? 'invisible' : ''}"
			>
				<ArrowLeft class="mr-1 size-3.5" /> Voltar
			</Button>

			<!-- dots -->
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
				<Button size="sm" onclick={goNext} disabled={!canAdvance} class="h-8 px-3 text-xs">
					Avançar <ArrowRight class="ml-1 size-3.5" />
				</Button>
			{:else}
				<!-- submit fica dentro do form, botão avançar vira fantasma para manter layout -->
				<div class="w-[72px]"></div>
			{/if}
		</div>

		<!-- CONTEXT BAR -->
		<div
			class="mb-4 flex min-h-8 flex-wrap items-center justify-center gap-x-3 gap-y-1
              rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
		>
			{#if !selectedService && !data.selectedDate && !selectedSlot}
				<span class="italic">Nenhuma seleção ainda</span>
			{:else}
				{#if multiService && selectedService}
					<span class="flex items-center gap-1">
						<Scissors class="size-3" />
						<strong class="font-medium text-foreground">{selectedService.name}</strong>
					</span>
				{/if}
				{#if data.selectedDate}
					{#if multiService && selectedService}<span class="text-border">·</span>{/if}
					<span class="flex items-center gap-1">
						<CalendarDays class="size-3" />
						<strong class="font-medium text-foreground">{dateLabel()}</strong>
					</span>
				{/if}
				{#if selectedSlot}
					<span class="text-border">·</span>
					<span class="flex items-center gap-1">
						<Clock class="size-3" />
						<strong class="font-medium text-foreground"
							>{formatSlot(selectedSlot.slot_start)}</strong
						>
					</span>
				{/if}
			{/if}
		</div>

		<!-- STEP PANELS -->

		{#if currentStep === 'service'}
			<div class="flex flex-col gap-2">
				{#each services as service}
					<button
						onclick={() => selectService(service.id)}
						class="flex items-center justify-between rounded-xl border p-4 text-left
                 transition-all hover:bg-muted/50
                 {selectedServiceId === service.id
							? 'border-foreground ring-1 ring-foreground'
							: 'border-border'}"
					>
						<div>
							<p class="font-semibold">{service.name}</p>
							<p class="text-xs text-muted-foreground">{service.duration} min</p>
						</div>
						{#if selectedServiceId === service.id}
							<Check class="size-4 shrink-0" />
						{/if}
					</button>
				{/each}
			</div>
		{:else if currentStep === 'date'}
			<Calendar
				bind:value={calendarValue}
				onValueChange={(v) => v && updateDate(v.toString())}
				class="w-full rounded-xl border"
				minValue={today(getLocalTimeZone())}
			/>
		{:else if currentStep === 'time'}
			{#if slots.length === 0}
				<p class="py-12 text-center text-sm text-muted-foreground">
					Nenhum horário disponível para este dia.
				</p>
			{:else}
				<div class="grid grid-cols-3 gap-2">
					{#each slots as slot}
						<Button
							variant={selectedSlot?.slot_start === slot.slot_start ? 'default' : 'outline'}
							class="h-11"
							onclick={() => (selectedSlot = slot)}
						>
							{formatSlot(slot.slot_start)}
						</Button>
					{/each}
				</div>
			{/if}
		{:else if currentStep === 'confirm'}
			<form
				method="POST"
				action="?/finishSelfBooking"
				use:enhance={() => {
					isLoading = true;
					return async ({ result }) => {
						if (result.type === 'success' && result.data?.appointmentId)
							await goto(`/${result.data.appointmentId}`, { replaceState: true });
						isLoading = false;
					};
				}}
				class="flex flex-col gap-4"
			>
				<input type="hidden" name="selected_date" value={data.selectedDate} />
				<input type="hidden" name="slot_start" value={selectedSlot?.slot_start} />
				<input type="hidden" name="service_id" value={selectedServiceId} />
				<input type="hidden" name="profile_id" value={professional.id} />

				<div class="space-y-2">
					<Label for="name">Seu nome</Label>
					<Input id="name" name="customer_name" bind:value={customerName} required />
				</div>
				<div class="space-y-2">
					<Label for="phone">WhatsApp</Label>
					<Input id="phone" name="customer_phone" type="tel" bind:value={customerPhone} required />
				</div>

				<Button type="submit" class="mt-2 w-full" disabled={isLoading || !canAdvance}>
					{#if isLoading}<LoaderCircle class="mr-2 size-4 animate-spin" />{/if}
					Reservar
				</Button>
			</form>
		{/if}
	</div>
{/if}
