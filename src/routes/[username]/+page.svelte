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

	// Otimização O(1) usando Set reativo para desabilitar dias vazios instantaneamente
	const availableDaysSet = $derived(new Set(data.availableDays || []));

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
	// 1. Runa de estado: guarda sempre os 11 dígitos limpos (ex: 11999999999)
	let rawPhone = $state('');
	let phoneTouched = $state(false);
	let isLoading = $state(false);

	// 2. Runa derivada: calcula a máscara em tempo real para o bind:value
	let customerPhone = $derived(formatarMascarar(rawPhone));

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

	// Função que avalia cada quadrado do calendário do shadcn (bits-ui)
	function isDateDisabled(date: any) {
		// Converte o objeto CalendarDate para string no padrão 'YYYY-MM-DD'
		const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;

		// Se o dia NÃO estiver na lista de dias disponíveis retornada da RPC, desativa-o
		return !availableDaysSet.has(dateString);
	}

	// 3. Regras de validação estritas (mínimo 11, máximo 11)
	const isPhoneValid = $derived(rawPhone.length === 11);
	const showPhoneError = $derived(phoneTouched && !isPhoneValid && rawPhone.length > 0);

	// Função que limpa letras/símbolos e trava em 11 caracteresmax
	function tratarInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const apenasNumeros = target.value.replace(/\D/g, '');
		rawPhone = apenasNumeros.slice(0, 11);
	}

	// Função que monta a máscara (11) 99999-9999 dinamicamente
	function formatarMascarar(v: string) {
		if (!v) return '';
		if (v.length <= 2) return `(${v}`;
		if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
		return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`;
	}
</script>

<svelte:head>
	<title>Agendar com {professional.full_name}</title>
</svelte:head>

{#if data.uiState === 'unavailable'}
	<div class="mx-auto max-w-sm px-4 py-12 text-center text-sm text-muted-foreground">
		Nenhum serviço ativo disponível para agendamento no momento.
	</div>
{:else}
	<div class="mx-auto max-w-sm px-4 pb-24">
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

		<div class="mb-3 flex items-center justify-between gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={goBack}
				class="h-8 px-3 text-xs {stepIndex === 0 ? 'invisible' : ''}"
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
				<Button size="sm" onclick={goNext} disabled={!canAdvance} class="h-8 px-3 text-xs">
					Avançar <ArrowRight class="ml-1 size-3.5" />
				</Button>
			{:else}
				<div class="w-[72px]"></div>
			{/if}
		</div>

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
				fixedWeeks
				{isDateDisabled}
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
				<!-- Inputs ocultos enviados ao backend -->
				<input type="hidden" name="selected_date" value={data.selectedDate} />
				<input type="hidden" name="slot_start" value={selectedSlot?.slot_start} />
				<input type="hidden" name="service_id" value={selectedServiceId} />
				<input type="hidden" name="profile_id" value={professional.id} />
				<!-- NOVO: Envia o telefone limpo (ex: 11999999999) -->
				<input type="hidden" name="customer_phone" value={rawPhone} />

				<div class="space-y-2">
					<Label for="name">Seu nome</Label>
					<Input id="name" name="customer_name" bind:value={customerName} required />
				</div>

				<div class="space-y-2">
					<Label for="phone">WhatsApp</Label>
					<!-- AJUSTADO: Removido o atributo name daqui para não sobrescrever o hidden -->
					<Input
						id="phone"
						type="tel"
						value={customerPhone}
						oninput={tratarInput}
						onblur={() => (phoneTouched = true)}
						placeholder="(11) 99999-9999"
						required
						class={showPhoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}
					/>

					{#if showPhoneError}
						<p class="animate-in text-xs font-medium text-red-500 duration-150 fade-in">
							O telefone deve ter exatamente 11 dígitos.
						</p>
					{/if}
				</div>

				<Button type="submit" class="mt-2 w-full" disabled={isLoading || !canAdvance}>
					{#if isLoading}<LoaderCircle class="mr-2 size-4 animate-spin" />{/if}
					Reservar
				</Button>
			</form>
		{/if}
	</div>
{/if}
