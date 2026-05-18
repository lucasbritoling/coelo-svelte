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
				class="flex flex-col gap-4"
			>
				<!-- Inputs ocultos enviados ao backend -->
				<input type="hidden" name="selected_date" value={data.selectedDate} />
				<input type="hidden" name="slot_start" value={selectedSlot?.slot_start} />
				<input type="hidden" name="service_id" value={selectedServiceId} />
				<input type="hidden" name="profile_id" value={professional.id} />
				<input type="hidden" name="customer_phone" value={rawPhone} />

				<div class="space-y-2">
					<Label for="name">Seu nome</Label>
					<Input id="name" name="customer_name" bind:value={customerName} required />
				</div>

				<div class="space-y-2">
					<Label for="phone" class="flex items-center gap-1.5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 175.216 175.552"
							class="size-4.5 shrink-0"
						>
							<defs>
								<linearGradient
									id="b"
									x1="85.915"
									x2="86.535"
									y1="32.567"
									y2="137.092"
									gradientUnits="userSpaceOnUse"
								>
									<stop offset="0" stop-color="#57d163" />
									<stop offset="1" stop-color="#23b33a" />
								</linearGradient>
								<filter
									id="a"
									width="1.115"
									height="1.114"
									x="-.057"
									y="-.057"
									color-interpolation-filters="sRGB"
								>
									<feGaussianBlur stdDeviation="3.531" />
								</filter>
							</defs>
							<path
								fill="#b3b3b3"
								d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0"
								filter="url(#a)"
							/>
							<path
								fill="#fff"
								d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"
							/>
							<path
								fill="url(#b)"
								d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928"
							/>
							<path
								fill="#fff"
								fill-rule="evenodd"
								d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"
							/>
						</svg>
						WhatsApp
					</Label>
					<Input
						id="phone"
						type="tel"
						inputmode="numeric"
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

				{#if rawPhone.length > 0}
					<div class="animate-in space-y-2 duration-200 fade-in slide-in-from-top-2">
						<Label for="confirmPhone" class="flex items-center gap-1.5">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 175.216 175.552"
								class="size-4.5 shrink-0"
							>
								<defs>
									<linearGradient
										id="b-confirm"
										x1="85.915"
										x2="86.535"
										y1="32.567"
										y2="137.092"
										gradientUnits="userSpaceOnUse"
									>
										<stop offset="0" stop-color="#57d163" />
										<stop offset="1" stop-color="#23b33a" />
									</linearGradient>
									<filter
										id="a-confirm"
										width="1.115"
										height="1.114"
										x="-.057"
										y="-.057"
										color-interpolation-filters="sRGB"
									>
										<feGaussianBlur stdDeviation="3.531" />
									</filter>
								</defs>
								<path
									fill="#b3b3b3"
									d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0"
									filter="url(#a-confirm)"
								/>
								<path
									fill="#fff"
									d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"
								/>
								<path
									fill="url(#b-confirm)"
									d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928"
								/>
								<path
									fill="#fff"
									fill-rule="evenodd"
									d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"
								/>
							</svg>
							Confirme seu WhatsApp
						</Label>
						<Input
							id="confirmPhone"
							type="tel"
							inputmode="numeric"
							value={customerConfirmPhone}
							oninput={tratarConfirmInput}
							onblur={() => (confirmPhoneTouched = true)}
							placeholder="(11) 99999-9999"
							required
							class={showConfirmPhoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}
						/>

						{#if showConfirmPhoneError}
							<p class="animate-in text-xs font-medium text-red-500 duration-150 fade-in">
								{#if !isValidPhone(rawConfirmPhone)}
									O telefone deve ter exatamente 11 dígitos.
								{:else if !phonesMatch}
									Os números de telefone não são idênticos.
								{/if}
							</p>
						{/if}
					</div>
				{/if}

				<Button type="submit" class="mt-2 w-full" disabled={isLoading || !canAdvance}>
					{#if isLoading}<LoaderCircle class="mr-2 size-4 animate-spin" />{/if}
					Reservar
				</Button>
			</form>
		{/if}
	</div>
{/if}
