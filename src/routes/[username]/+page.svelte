<script lang="ts">
	import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { Calendar } from '$lib/components/ui/calendar/index.js';
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
	import { sanitizePhone, formatPhoneMask, isValidPhone } from '$lib/utils/phone';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const professional = $derived(data.professional);
	const services = $derived(data.services);
	const slots = $derived(data.slots);
	const multiService = $derived(services.length > 1);

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

	// Estado do primeiro telefone
	let rawPhone = $state('');
	let phoneTouched = $state(false);
	let customerPhone = $derived(formatPhoneMask(rawPhone));

	// Estado do telefone de confirmação
	let rawConfirmPhone = $state('');
	let confirmPhoneTouched = $state(false);
	let customerConfirmPhone = $derived(formatPhoneMask(rawConfirmPhone));

	let isLoading = $state(false);

	// ── Validação em background para o canAdvance ───────────────────
	const phonesMatch = $derived(rawPhone === rawConfirmPhone);
	const isPhoneValid = $derived(isValidPhone(rawPhone));

	const canAdvance = $derived(
		currentStep === 'service'
			? !!selectedServiceId
			: currentStep === 'date'
				? !!data.selectedDate
				: currentStep === 'time'
					? !!selectedSlot
					: currentStep === 'confirm'
						? customerName.length > 2 && isPhoneValid && phonesMatch
						: false
	);

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

	function isDateDisabled(date: any) {
		const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
		return !availableDaysSet.has(dateString);
	}

	// ── Regras de Exibição de Erro (Apenas se touched) ────────────────
	const showPhoneError = $derived(phoneTouched && !isPhoneValid && rawPhone.length > 0);
	const showConfirmPhoneError = $derived(
		confirmPhoneTouched &&
			rawConfirmPhone.length > 0 &&
			(!isValidPhone(rawConfirmPhone) || !phonesMatch)
	);

	// Trata input principal e reseta o erro visual enquanto digita
	function tratarInput(e: Event) {
		const target = e.target as HTMLInputElement;
		phoneTouched = false; // Esconde o erro enquanto o usuário digita
		rawPhone = sanitizePhone(target.value);
		target.value = formatPhoneMask(rawPhone);
	}

	// Trata confirmação e reseta o erro visual enquanto digita
	function tratarConfirmInput(e: Event) {
		const target = e.target as HTMLInputElement;
		confirmPhoneTouched = false; // Esconde o erro enquanto o usuário digita
		rawConfirmPhone = sanitizePhone(target.value);
		target.value = formatPhoneMask(rawConfirmPhone);
	}
</script>

<svelte:head>
	<title>Agendar com {professional.full_name}</title>
</svelte:head>

{#if data.uiState === 'unavailable'}
	<div class="mx-auto max-w-md px-6 py-24 text-center text-sm tracking-tight text-neutral-500">
		Nenhum serviço ativo disponível para agendamento no momento.
	</div>
{:else}
	<div class="mx-auto max-w-md px-6 pt-8 pb-24 antialiased selection:bg-neutral-100">
		<!-- Header Principal -->
		<header class="mb-8 flex flex-col items-center text-center">
			<div class="relative mb-4">
				<div
					class="relative size-20 overflow-hidden rounded-full border border-neutral-200/80 bg-neutral-50 p-0.5 shadow-sm"
				>
					{#if professional.avatar_url}
						<img
							src={professional.avatar_url}
							alt={professional.full_name}
							class="h-full w-full rounded-full object-cover grayscale-[10%]"
						/>
					{/if}
				</div>
			</div>
			<h1 class="text-xl font-semibold tracking-tight text-neutral-900">
				{professional.full_name}
			</h1>
			<p class="mt-0.5 text-xs font-medium tracking-normal text-neutral-400">
				@{professional.username}
			</p>
		</header>

		<!-- Navegação de Passos -->
		<div class="mb-6 flex items-center justify-between border-b border-neutral-100 pb-4">
			<Button
				variant="ghost"
				size="sm"
				onclick={goBack}
				class="h-8 px-2.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 {stepIndex ===
				0
					? 'invisible'
					: ''}"
			>
				<ArrowLeft class="mr-1.5 size-3.5 stroke-[2]" /> Voltar
			</Button>

			<!-- Indicadores Minimalistas -->
			<div class="flex items-center gap-1">
				{#each steps as _, i}
					<div
						class="h-1 rounded-full transition-all duration-300 ease-out
                        {i === stepIndex
							? 'w-6 bg-neutral-900'
							: i < stepIndex
								? 'w-2 bg-neutral-400'
								: 'w-1.5 bg-neutral-200'}"
					></div>
				{/each}
			</div>

			{#if currentStep !== 'confirm'}
				<Button
					variant="ghost"
					size="sm"
					onclick={goNext}
					disabled={!canAdvance}
					class="h-8 px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-30"
				>
					Avançar <ArrowRight class="ml-1.5 size-3.5 stroke-[2]" />
				</Button>
			{:else}
				<div class="w-[68px]"></div>
			{/if}
		</div>

		<!-- Resumo das Seleções (Context Bar) -->
		<div
			class="mb-6 min-h-9.5 rounded-lg border border-neutral-200/60 bg-neutral-50/50 p-2.5 text-xs text-neutral-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
		>
			<div class="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
				{#if !selectedService && !data.selectedDate && !selectedSlot}
					<span class="tracking-tight text-neutral-400"
						>Selecione as opções abaixo para prosseguir</span
					>
				{:else}
					{#if multiService && selectedService}
						<div class="flex items-center gap-1.5 font-medium text-neutral-800">
							<Scissors class="size-3.5 stroke-[1.75] text-neutral-400" />
							<span>{selectedService.name}</span>
						</div>
					{/if}

					{#if data.selectedDate}
						{#if multiService && selectedService}<span class="font-light text-neutral-300">|</span
							>{/if}
						<div class="flex items-center gap-1.5 font-medium text-neutral-800">
							<CalendarDays class="size-3.5 stroke-[1.75] text-neutral-400" />
							<span>{dateLabel()}</span>
						</div>
					{/if}

					{#if selectedSlot}
						<span class="font-light text-neutral-300">|</span>
						<div class="flex items-center gap-1.5 font-medium text-neutral-800">
							<Clock class="size-3.5 stroke-[1.75] text-neutral-400" />
							<span>{formatSlot(selectedSlot.slot_start)}</span>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Conteúdo dos Passos -->
		{#if currentStep === 'service'}
			<div class="flex animate-in flex-col gap-2 duration-200 fade-in-50">
				{#each services as service}
					<button
						onclick={() => selectService(service.id)}
						class="group flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200
                        {selectedServiceId === service.id
							? 'border-neutral-900 bg-neutral-900/5 shadow-sm'
							: 'border-neutral-200/80 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'}"
					>
						<div class="space-y-0.5">
							<p
								class="text-sm font-semibold tracking-tight text-neutral-950 group-hover:text-neutral-900"
							>
								{service.name}
							</p>
							<p class="text-xs font-medium text-neutral-400">{service.duration} min</p>
						</div>
						{#if selectedServiceId === service.id}
							<div class="rounded-full bg-neutral-900 p-1 text-white">
								<Check class="size-3 stroke-[3]" />
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{:else if currentStep === 'date'}
			<div
				class="animate-in rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm duration-200 fade-in-50"
			>
				<Calendar
					bind:value={calendarValue}
					fixedWeeks
					{isDateDisabled}
					onValueChange={(v) => v && updateDate(v.toString())}
					class="w-full"
					minValue={today(getLocalTimeZone())}
				/>
			</div>
		{:else if currentStep === 'time'}
			{#if slots.length === 0}
				<p class="animate-in py-16 text-center text-sm tracking-tight text-neutral-400 fade-in-50">
					Nenhum horário disponível para este dia.
				</p>
			{:else}
				<div class="grid animate-in grid-cols-3 gap-2 duration-200 fade-in-50">
					{#each slots as slot}
						<Button
							variant={selectedSlot?.slot_start === slot.slot_start ? 'default' : 'outline'}
							class="h-11 text-xs font-semibold tracking-tight transition-all duration-150
                            {selectedSlot?.slot_start === slot.slot_start
								? 'bg-neutral-900 text-white shadow-sm'
								: 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50'}"
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
						if (result.type === 'success' && result.data?.appointmentId) {
							toast.success('Agendamento realizado com sucesso!');
							await goto(`/${result.data.appointmentId}`, { replaceState: true });
						}

						if (result.type === 'failure') {
							const errorMessage = result.data?.message || 'Erro ao processar agendamento.';
							toast.error(errorMessage);
						}

						isLoading = false;
					};
				}}
				class="flex animate-in flex-col gap-4 duration-200 fade-in-50"
			>
				<input type="hidden" name="selected_date" value={data.selectedDate} />
				<input type="hidden" name="slot_start" value={selectedSlot?.slot_start} />
				<input type="hidden" name="service_id" value={selectedServiceId} />
				<input type="hidden" name="profile_id" value={professional.id} />
				<input type="hidden" name="customer_phone" value={rawPhone} />

				<div class="space-y-1.5">
					<Label for="name" class="text-xs font-semibold tracking-tight text-neutral-700"
						>Seu nome completo</Label
					>
					<Input
						id="name"
						name="customer_name"
						bind:value={customerName}
						placeholder="Ex: João Silva"
						required
						class="h-10 border-neutral-200/80 placeholder:text-neutral-400 focus-visible:ring-neutral-950"
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="phone" class="text-xs font-semibold tracking-tight text-neutral-700"
						>WhatsApp</Label
					>
					<div class="relative flex items-center">
						<Input
							id="phone"
							type="tel"
							inputmode="numeric"
							value={customerPhone}
							oninput={tratarInput}
							onblur={() => (phoneTouched = true)}
							placeholder="(11) 99999-9999"
							required
							class="h-10 border-neutral-200/80 placeholder:text-neutral-400 focus-visible:ring-neutral-950
                            {showPhoneError
								? 'border-red-500 bg-red-50/10 focus-visible:ring-red-500'
								: ''}"
						/>
					</div>

					{#if showPhoneError}
						<p
							class="animate-in text-[11px] font-medium text-red-500 duration-150 fade-in-50 slide-in-from-top-1"
						>
							O telefone deve ter exatamente 11 dígitos.
						</p>
					{/if}
				</div>

				{#if rawPhone.length > 0}
					<div
						class="animate-in space-y-1.5 border-t border-neutral-100 pt-3 duration-300 fade-in-50 slide-in-from-top-2"
					>
						<Label for="confirmPhone" class="text-xs font-semibold tracking-tight text-neutral-700"
							>Confirme seu WhatsApp</Label
						>
						<Input
							id="confirmPhone"
							type="tel"
							inputmode="numeric"
							value={customerConfirmPhone}
							oninput={tratarConfirmInput}
							onblur={() => (confirmPhoneTouched = true)}
							placeholder="(11) 99999-9999"
							required
							class="h-10 border-neutral-200/80 placeholder:text-neutral-400 focus-visible:ring-neutral-950
                            {showConfirmPhoneError
								? 'border-red-500 bg-red-50/10 focus-visible:ring-red-500'
								: ''}"
						/>

						{#if showConfirmPhoneError}
							<p
								class="animate-in text-[11px] font-medium text-red-500 duration-150 fade-in-50 slide-in-from-top-1"
							>
								{#if !isValidPhone(rawConfirmPhone)}
									O telefone deve ter exatamente 11 dígitos.
								{:else if !phonesMatch}
									Os números de telefone não são idênticos.
								{/if}
							</p>
						{/if}
					</div>
				{/if}

				<Button
					type="submit"
					class="mt-4 h-11 w-full bg-neutral-900 font-semibold tracking-tight text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
					disabled={isLoading || !canAdvance}
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 size-4 animate-spin text-neutral-400" />
					{/if}
					Confirmar Reserva
				</Button>
			</form>
		{/if}
	</div>
{/if}
