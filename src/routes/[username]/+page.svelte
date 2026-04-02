<script lang="ts">
	import {
		today,
		getLocalTimeZone,
		parseDate,
		parseAbsoluteToLocal
	} from '@internationalized/date';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let { data } = $props();

	const { professional, services, slots } = $derived(data);
	const selectedService = $derived(services.find((s) => s.id == data.selectedServiceId));

	let selectedSlot = $state<any>(null);
	let isConfirming = $state(false);
	let customerName = $state('');
	let customerPhone = $state('');

	// Sincroniza o componente de Calendário com a data que veio da URL
	let calendarValue = $state(
		data.selectedDate ? parseDate(data.selectedDate) : today(getLocalTimeZone())
	);

	async function updateSelection(params: { date?: string; serviceId?: string }) {
		// resetamos estados locais ao trocar data/serviço para evitar confusão
		selectedSlot = null;
		isConfirming = false;

		const newUrl = new URL(page.url);
		if (params.date) newUrl.searchParams.set('date', params.date);
		if (params.serviceId) newUrl.searchParams.set('serviceId', params.serviceId);

		await goto(newUrl.search, {
			keepFocus: true,
			noScroll: true,
			replaceState: true // não polui histórico do browser
		});
	}

	function formatSlotTime(isoString: string) {
		try {
			// Como o banco já envia "+00:00", o parseAbsoluteToLocal
			// entende que é UTC e converte para o fuso local do usuário.
			return parseAbsoluteToLocal(isoString).toDate().toLocaleTimeString('pt-BR', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (e) {
			console.error('Erro ao formatar horário:', e);
			return isoString;
		}
	}
</script>

<div class="mx-auto max-w-4xl p-6">
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

	<div class="grid gap-8 lg:grid-cols-3">
		<Card.Root class="lg:col-span-1">
			<Card.Header>
				<Card.Title>1. Escolha o serviço</Card.Title>
			</Card.Header>
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
								<span class="text-xs text-muted-foreground"
									>{service.duration} min • R$ {service.price}</span
								>
							</Label>
						</div>
					{/each}
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-1">
			<Card.Header>
				<Card.Title>2. Selecione o dia</Card.Title>
			</Card.Header>
			<Card.Content>
				<Calendar
					bind:value={calendarValue}
					onValueChange={(v) => updateSelection({ date: v?.toString() })}
					class="rounded-md border shadow-sm"
				/>
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-1">
			<Card.Header>
				<Card.Title>3. Horários</Card.Title>
				<Card.Description>
					{#if !data.selectedServiceId}
						Selecione um serviço primeiro
					{:else if !data.selectedDate}
						Selecione uma data
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if !isConfirming}
					{#if slots.length > 0}
						<div class="grid grid-cols-2 gap-2">
							{#each slots as slot (slot.slot_start)}
								<Button
									variant={selectedSlot?.slot_start === slot.slot_start ? 'default' : 'outline'}
									class="font-mono transition-all"
									onclick={() => (selectedSlot = slot)}
								>
									{formatSlotTime(slot.slot_start)}
								</Button>
							{/each}
						</div>

						{#if selectedSlot}
							<div class="mt-6 animate-in border-t pt-4 fade-in slide-in-from-top-2">
								<Button class="w-full" size="lg" onclick={() => (isConfirming = true)}>
									Avançar
								</Button>
							</div>
						{/if}
					{:else if data.selectedServiceId && data.selectedDate}
						<p class="py-4 text-center text-sm text-muted-foreground">Sem horários disponíveis.</p>
					{/if}
				{:else}
					<form
						method="POST"
						action="?/createAppointment"
						use:enhance
						class="animate-in space-y-4 fade-in slide-in-from-right-4"
					>
						<input type="hidden" name="slot_start" value={selectedSlot.slot_start} />
						<input type="hidden" name="service_id" value={data.selectedServiceId} />
						<input type="hidden" name="profile_id" value={professional.id} />
						<input type="hidden" name="username" value={professional.username} />

						<div class="space-y-2">
							<Label for="customer_name">Seu Nome</Label>
							<Input
								name="customer_name"
								id="customer_name"
								bind:value={customerName}
								required
								placeholder="Como deseja ser chamado?"
							/>
						</div>

						<div class="space-y-2">
							<Label for="customer_phone">Telefone / WhatsApp</Label>
							<Input
								name="customer_phone"
								id="customer_phone"
								bind:value={customerPhone}
								required
								placeholder="(00) 00000-0000"
							/>
						</div>

						<div class="flex gap-2 pt-4">
							<Button variant="outline" class="flex-1" onclick={() => (isConfirming = false)}
								>Voltar</Button
							>
							<Button type="submit" class="flex-1">Finalizar Agendamento</Button>
						</div>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
