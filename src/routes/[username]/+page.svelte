<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Label } from '$lib/components/ui/label/index.js';
	import { today, getLocalTimeZone, parseDate } from '@internationalized/date';

	let { data } = $props();

	// Estado derivado para facilitar o acesso
	const { professional, services, slots } = $derived(data);

	// Sincroniza a data do calendário com a URL ou "Hoje"
	let calendarValue = $state(
		data.selectedDate ? parseDate(data.selectedDate) : today(getLocalTimeZone())
	);

	// Função para atualizar a URL e disparar o load novamente (reatividade do SvelteKit)
	function updateSelection(params: { date?: string; serviceId?: string }) {
		const newUrl = new URL(page.url);
		if (params.date) newUrl.searchParams.set('date', params.date);
		if (params.serviceId) newUrl.searchParams.set('serviceId', params.serviceId);

		goto(newUrl, { keepFocus: true, noScroll: true, replaceState: true });
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
				{#if slots.length > 0}
					<div class="grid grid-cols-2 gap-2">
						{#each slots as slot (slot.id)}
							<Button variant="outline" class="font-mono">
								{new Date(slot.slot_start).toLocaleTimeString([], {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</Button>
						{/each}
					</div>
				{:else if data.selectedServiceId && data.selectedDate}
					<p class="text-center text-sm text-muted-foreground">
						Sem horários disponíveis para este dia.
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
