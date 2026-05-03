<script lang="ts">
	import { Check, ChevronsUpDown, LoaderCircle, Plus } from '@lucide/svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { parseTime } from '@internationalized/date';

	// Importação dos componentes de formulário
	import ServiceForm from './service-form.svelte';
	import CustomerForm from './customer-form.svelte';

	// 1. Props (Svelte 5)
	let {
		customers = [],
		services = [],
		selectedDate,
		data,
		onSuccess
	} = $props<{
		customers: any[];
		services: any[];
		selectedDate: string;
		data: any;
		onSuccess?: () => void;
	}>();

	// 2. Estados
	let openCustomer = $state(false);
	let openService = $state(false);
	let isLoading = $state(false);

	// Estados para os Modais
	let showServiceModal = $state(false);
	let showCustomerModal = $state(false);

	// Estados para capturar o que o usuário digita na busca
	let serviceSearch = $state('');
	let customerSearch = $state('');

	let customerId = $state('');
	let serviceId = $state('');
	let startTime = $state('09:00');

	// 3. Derivados
	let selectedService = $derived(services.find((s) => s.id === serviceId));
	let selectedCustomerName = $derived(
		customers.find((c) => c.id === customerId)?.name ?? 'Selecionar cliente...'
	);
	let selectedServiceName = $derived(
		services.find((s) => s.id === serviceId)?.name ?? 'Selecionar serviço...'
	);

	let endTime = $derived.by(() => {
		if (!startTime || !selectedService) return '';
		try {
			const time = parseTime(startTime);
			const end = time.add({ minutes: selectedService.duration });
			return end.toString().slice(0, 5);
		} catch {
			return '';
		}
	});

	// Funções de callback para quando o sub-recurso for criado
	function handleCustomerCreated(customer: any) {
		// Extraímos o ID do objeto que o CustomerForm enviou
		const id = customer?.id || customer;

		if (id) {
			customerId = id; // Agora sim, atribuindo a string ao estado
			customerSearch = ''; // Limpa o campo de busca
			openCustomer = false; // Fecha o popover de seleção (se estiver aberto)
		}

		showCustomerModal = false; // Fecha o modal de criação
	}

	function handleServiceCreated(service: any) {
		// Extraímos o ID do objeto ou da string
		const id = service?.id || service;

		if (id) {
			serviceId = id; // Seleciona automaticamente
			serviceSearch = ''; // Limpa a busca do Command
			openService = false; // Fecha o popover da agenda
		}

		showServiceModal = false; // Fecha o modal de criação
	}
</script>

<form
	method="POST"
	action="?/create"
	class="grid gap-6 py-4"
	use:enhance={() => {
    isLoading = true;
    return async ({ result, update }) => {
        await update();
        isLoading = false;

        if (result.type === 'success') {
			toast.success('Ok');
            onSuccess?.();
        } else if (result.type === 'failure') {
            toast.error(result.data?.message ?? 'Erro ao agendar.');
        }
    };
}}
>
	<input type="hidden" name="customer_id" value={customerId} />
	<input type="hidden" name="service_id" value={serviceId} />
	<input type="hidden" name="date" value={selectedDate} />
	<input type="hidden" name="end_at" value={endTime} />

	<!-- Cliente -->
	<div class="grid gap-2">
		<Label>Cliente</Label>
		<Popover.Root bind:open={openCustomer}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						role="combobox"
						aria-expanded={openCustomer}
						class="w-full cursor-pointer justify-between font-normal hover:shadow-sm"
					>
						{selectedCustomerName}
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
				<Command.Root>
					<Command.Input placeholder="Buscar cliente..." bind:value={customerSearch} />
					<Command.List>
						<Command.Empty>
							<div class="flex flex-col items-center gap-2 px-2 py-4 text-center">
								<p class="text-sm text-muted-foreground">Cliente não encontrado.</p>
								<Button
									variant="secondary"
									size="sm"
									class="h-8 w-full"
									onclick={() => {
										openCustomer = false;
										showCustomerModal = true;
									}}
								>
									<Plus class="mr-2 size-3" />
									Criar "{customerSearch}"
								</Button>
							</div>
						</Command.Empty>
						<Command.Group>
							{#each customers as customer (customer.id)}
								<Command.Item
									value={customer.name}
									class="cursor-pointer"
									onSelect={() => {
										customerId = customer.id;
										openCustomer = false;
									}}
								>
									<Check
										class={cn('mr-2 size-4', customerId !== customer.id && 'text-transparent')}
									/>
									{customer.name}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	<!-- Serviço -->
	<div class="grid gap-2">
		<Label>Serviço</Label>
		<Popover.Root bind:open={openService}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						role="combobox"
						aria-expanded={openService}
						class="w-full cursor-pointer justify-between font-normal hover:shadow-sm"
					>
						{selectedServiceName}
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
				<Command.Root>
					<Command.Input placeholder="Buscar serviço..." bind:value={serviceSearch} />
					<Command.List>
						<Command.Empty>
							<div class="flex flex-col items-center gap-2 px-2 py-4 text-center">
								<p class="text-sm text-muted-foreground">Serviço não encontrado.</p>
								<Button
									variant="secondary"
									size="sm"
									class="h-8 w-full"
									onclick={() => {
										openService = false;
										showServiceModal = true;
									}}
								>
									<Plus class="mr-2 size-3" />
									Criar "{serviceSearch}"
								</Button>
							</div>
						</Command.Empty>
						<Command.Group>
							{#each services as service (service.id)}
								<Command.Item
									class="cursor-pointer"
									value={service.name}
									onSelect={() => {
										serviceId = service.id;
										openService = false;
									}}
								>
									<Check
										class={cn('mr-2 size-4', serviceId !== service.id && 'text-transparent')}
									/>
									<div class="flex flex-1 items-center justify-between">
										<span>{service.name}</span>
										<span class="text-xs text-muted-foreground">{service.duration} min</span>
									</div>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	<!-- Tempos -->
	<div class="grid grid-cols-2 gap-4">
		<div class="grid gap-2">
			<Label for="start_at">Início</Label>
			<Input
				id="start_at"
				class="cursor-pointer hover:shadow-sm"
				name="start_at"
				type="time"
				bind:value={startTime}
				required
			/>
		</div>
		<div class="grid gap-2">
			<Label for="end_at" class="opacity-80">Término (Auto)</Label>
			<Input
				id="end_at"
				type="time"
				value={endTime}
				readonly
				class="bg-muted/50 text-muted-foreground"
			/>
		</div>
	</div>

	<div class="pt-2">
		<Button
			type="submit"
			disabled={isLoading || !customerId || !serviceId}
			class="w-full cursor-pointer hover:shadow-sm"
		>
			{#if isLoading}
				<LoaderCircle class="mr-2 size-4 animate-spin" />
				Salvando...
			{:else}
				Salvar Horário
			{/if}
		</Button>
	</div>
</form>

<!-- Componentes de criação rápida -->
<ServiceForm
	bind:open={showServiceModal}
	formData={data.serviceForm}
	initialName={serviceSearch}
	onSuccess={handleServiceCreated}
/>

<CustomerForm
	bind:open={showCustomerModal}
	formData={data.customerForm}
	initialName={customerSearch}
	onSuccess={handleCustomerCreated}
/>

<style>
	:global([data-sonner-toast]) {
		width: fit-content !important;
		min-width: unset !important;
		padding: 8px 12px !important;
	}

	:global([data-sonner-toast] [data-content]) {
		margin: 0 !important;
	}
</style>
