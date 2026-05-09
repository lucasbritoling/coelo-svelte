<script lang="ts">
	import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		LoaderCircle,
		CircleCheckBig,
		CalendarCheck2,
		CalendarX2,
		ArrowLeft,
		Share2
	} from '@lucide/svelte';

	let { data, form } = $props();

	const { professional, services, slots } = $derived(data);
	const selectedService = $derived(services.find((s) => s.id == data.selectedServiceId));

	let isLoading = $state(false);
	let isSuccess = $state(false);

	let bookingSnapshot = $state<{
		serviceName: string;
		date: string;
		time: string;
	} | null>(null);

	let selectedSlot = $state<any>(null);
	let isConfirming = $state(false);
	let customerName = $state('');
	let customerPhone = $state('');

	// Sincroniza o componente de Calendário com a data que veio da URL
	let calendarValue = $state<any>(data.selectedDate ? parseDate(data.selectedDate) : null);

	async function updateSelection(params: { date?: string; serviceId?: string }) {
		// resetamos estados locais ao trocar data/serviço para evitar confusão
		selectedSlot = null;
		isConfirming = false;

		const newUrl = new URL(page.url);
		if (params.date) newUrl.searchParams.set('date', params.date);
		if (params.serviceId) newUrl.searchParams.set('serviceId', params.serviceId);

		if (data.singleService && !newUrl.searchParams.get('serviceId')) {
			newUrl.searchParams.set('serviceId', String(data.services[0].id));
		}

		await goto(newUrl.search, {
			keepFocus: true,
			noScroll: true,
			replaceState: true // não polui histórico do browser
		});
	}

	function formatSlotTime(time: string) {
		if (!time) return '';
		// Caso venha "14:30:00", pegamos só os 5 primeiros caracteres
		return time.slice(0, 5);
	}

	let showCopiedFeedback = $state(false);
	function handleShare() {
		if (!bookingSnapshot) return;

		const shareData = {
			title: 'Meu Agendamento',
			text: `${bookingSnapshot.serviceName} com ${professional.full_name} dia ${bookingSnapshot.date} às ${bookingSnapshot.time}.`,
			url: window.location.href
		};

		if (navigator.share) {
			navigator.share(shareData).catch(() => {});
		} else {
			navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);

			// Feedback visual com timeout
			showCopiedFeedback = true;
			setTimeout(() => {
				showCopiedFeedback = false;
			}, 3000);
		}
	}
</script>

<svelte:head>
	<title>Agendamento com {professional.full_name}</title>
	<meta
		name="description"
		content="Reserve seu horário com @{professional.username}. Rápido e simples."
	/>

	<!-- Aqui entra a imagem que você queria -->
	<meta property="og:image" content={professional.avatar_url} />
	<meta property="og:title" content="Agendamento com {professional.full_name}" />
	<meta
		property="og:description"
		content="Confira os horários disponíveis para {selectedService?.name ?? 'serviços'}."
	/>

	<!-- Twitter/X -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={professional.avatar_url} />
</svelte:head>

<div class="mx-auto p-6 {data.singleService ? 'max-w-sm' : 'max-w-sm lg:max-w-5xl'}">
	<!-- HEADER (Sempre visível como você pediu) -->
	<header class="mb-8 text-center">
		<div class="mx-auto mb-4 size-24 overflow-hidden rounded-full border-2 bg-muted shadow-sm">
			{#if professional.avatar_url}
				<img
					src={professional.avatar_url}
					alt={professional.full_name}
					class="h-full w-full object-cover"
				/>
			{/if}
		</div>
		<h1 class="text-3xl font-bold tracking-tight">{professional.full_name}</h1>
		<p class="font-medium text-muted-foreground">@{professional.username}</p>
	</header>

	{#if isSuccess && bookingSnapshot}
		<!-- TELA DE SUCESSO (Oculta todo o resto) -->
		<div class="mx-auto max-w-md animate-in duration-500 zoom-in-95 fade-in">
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center p-8 py-4 text-center">
					<div
						class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm"
					>
						<CircleCheckBig class="h-10 w-10" />
					</div>

					<h2 class="text-2xl font-bold tracking-tight text-foreground">Agendamento Confirmado!</h2>
					<p class="mt-2 text-sm text-muted-foreground">
						Tudo pronto, {customerName.split(' ')[0]}. Aqui estão os detalhes:
					</p>

					<div class="mt-8 w-full space-y-3 rounded-xl border bg-muted/30 p-4 text-left">
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Serviço</span>
							<span class="font-medium text-primary">{bookingSnapshot.serviceName}</span>
						</div>
						<hr class="border-dashed" />
						<div class="flex items-center justify-between">
							<div class="flex flex-col">
								<span class="text-[10px] tracking-wider text-muted-foreground uppercase"
									>Data e Hora</span
								>
								<span class="text-base font-semibold">
									{bookingSnapshot.date} às {bookingSnapshot.time}
								</span>
							</div>
							<CalendarCheck2 class="h-5 w-5 text-muted-foreground/50" />
						</div>
					</div>

					<div class="mt-8 w-full space-y-6">
						<button
							onclick={handleShare}
							disabled={showCopiedFeedback}
							class="mx-auto flex cursor-pointer items-center gap-2 text-xs font-medium transition-all duration-200 {showCopiedFeedback
								? 'text-emerald-600'
								: 'text-muted-foreground hover:text-primary'}"
						>
							{#if showCopiedFeedback}
								<CircleCheckBig class="h-3.5 w-3.5 animate-in zoom-in" />
								Copiado para a área de transferência!
							{:else}
								<Share2 class="h-3.5 w-3.5" />
								Compartilhar agendamento
							{/if}
						</button>

						<p class="text-[10px] text-muted-foreground">
							Dúvidas? Entre em contato com o profissional.
						</p>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{:else if !data.hasActiveServices}
		<!-- TELA DE ESTADO VAZIO -->
		<Card.Root class="mx-auto max-w-md border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
				<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
					<CalendarX2 class="h-10 w-10 text-muted-foreground" />
				</div>
				<h2 class="text-xl font-semibold">Agenda indisponível</h2>
				<p class="mt-2 text-sm text-muted-foreground">
					Este profissional não possui serviços ativos.
				</p>
				<Button variant="outline" class="mt-8" onclick={() => history.back()}>
					<ArrowLeft class="mr-2 h-4 w-4" /> Voltar
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- GRID DE AGENDAMENTO (Só aparece se não for sucesso e tiver serviços) -->
		<div class="grid gap-8 lg:grid-cols-{data.singleService ? '2' : '3'}">
			{#if !data.singleService}
				<!-- Card de Seleção de Serviço -->
				<Card.Root class="lg:col-span-1">
					<Card.Header><Card.Title>Escolha o serviço</Card.Title></Card.Header>
					<Card.Content>
						<RadioGroup.Root
							value={data.selectedServiceId}
							onValueChange={(id) => updateSelection({ serviceId: id })}
						>
							{#each services as service (service.id)}
								<div
									class="flex items-center space-x-2 rounded-lg border p-3 transition-colors hover:bg-muted"
								>
									<RadioGroup.Item value={service.id} id={service.id} />
									<Label for={service.id} class="flex flex-1 cursor-pointer flex-col">
										<span class="font-bold">{service.name}</span>
										<span class="text-xs text-muted-foreground">{service.duration} min</span>
									</Label>
								</div>
							{/each}
						</RadioGroup.Root>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Card de Calendário -->
			<Card.Root class="lg:col-span-1">
				<Card.Header><Card.Title>Escolha o dia</Card.Title></Card.Header>
				<Card.Content>
					<Calendar
						bind:value={calendarValue}
						onValueChange={(v) => updateSelection({ date: v?.toString() })}
						class="rounded-md border shadow-sm"
						fixedWeeks
						minValue={today(getLocalTimeZone())}
					/>
				</Card.Content>
			</Card.Root>

			<!-- Card de Horários / Formulário -->
			<Card.Root class="flex h-full flex-col lg:col-span-1">
				<Card.Header>
					<div class="flex h-8 items-center justify-between">
						<div>
							<Card.Title>Horários</Card.Title>
							<Card.Description>
								{#if !data.selectedServiceId}Selecione um serviço primeiro{:else if !data.selectedDate}Selecione
									uma data primeiro{/if}
							</Card.Description>
						</div>
						{#if !isConfirming && selectedSlot}
							<Button size="sm" class="h-7.5 w-20.5" onclick={() => (isConfirming = true)}
								>Avançar</Button
							>
						{/if}
					</div>
				</Card.Header>
				<Card.Content class="flex flex-1 flex-col">
					{#if !isConfirming}
						<!-- Listagem de slots... (seu código original aqui) -->
						{#if slots.length > 0}
							<div class="grid grid-cols-2 gap-2">
								{#each slots as slot (slot.slot_start)}
									<Button
										variant={selectedSlot?.slot_start === slot.slot_start ? 'default' : 'outline'}
										onclick={() => (selectedSlot = slot)}
									>
										{formatSlotTime(slot.slot_start)}
									</Button>
								{/each}
							</div>
						{:else if data.selectedServiceId && data.selectedDate}
							<p class="py-4 text-center text-sm text-muted-foreground">
								Sem horários disponíveis.
							</p>
						{/if}
					{:else}
						<!-- Formulário de confirmação... (seu código original aqui) -->
						<form
							method="POST"
							action="?/finishSelfBooking"
							use:enhance={() => {
								isLoading = true;
								return async ({ result, update }) => {
									if (result.type === 'success') {
										bookingSnapshot = {
											serviceName:
												services.find((s) => s.id === data.selectedServiceId)?.name ?? '',
											date: `${calendarValue?.day}/${calendarValue?.month}/${calendarValue?.year}`,
											time: selectedSlot?.slot_start
										};
										isLoading = false;
										isSuccess = true;
									} else if (result.type === 'failure') {
										await update();
										isLoading = false;
									}
								};
							}}
							class="flex flex-1 animate-in flex-col space-y-4 fade-in slide-in-from-right-4"
						>
							<input type="hidden" name="selected_date" value={calendarValue?.toString() ?? ''} />
							<input type="hidden" name="slot_start" value={selectedSlot?.slot_start} />
							<input type="hidden" name="profile_id" value={professional.id} />
							<input type="hidden" name="service_id" value={data.selectedServiceId} />

							<div class="justify-center space-y-2">
								<Label for="customer_name">Seu Nome</Label>
								<Input
									name="customer_name"
									id="customer_name"
									placeholder="Maria Oliveira"
									bind:value={customerName}
									required
									oninput={(e) => {
										// Remove números e mantém o trim interno de espaços
										customerName = e.currentTarget.value.replace(/\d/g, '').replace(/\s{2,}/g, ' ');
									}}
									onblur={() => (customerName = customerName.trim())}
								/>
							</div>

							<div class="justify-center space-y-2">
								<Label for="customer_phone">Telefone / WhatsApp</Label>
								<Input
									name="customer_phone"
									id="customer_phone"
									bind:value={customerPhone}
									required
									pattern="[0-9]+"
									inputmode="numeric"
									minlength={11}
									maxlength={11}
									placeholder="11 99999-9999"
									oninput={(e) => {
										// Limpeza radical: mantém apenas dígitos 0-9
										customerPhone = e.currentTarget.value.replace(/\D/g, '');
									}}
								/>
							</div>

							<div class="mt-auto flex w-full justify-center gap-2 pt-4">
								<Button
									variant="outline"
									disabled={isLoading}
									class="flex-1"
									onclick={() => (isConfirming = false)}>Voltar</Button
								>
								<Button type="submit" disabled={isLoading} class="flex-1">
									{#if isLoading}
										<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
										Processando...
									{:else}
										Finalizar Agendamento
									{/if}
								</Button>
							</div>
						</form>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
