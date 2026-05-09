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
	import { page } from '$app/state'; // Para ler a URL
	import { goto } from '$app/navigation'; // Para atualizar a URL

	// Importação dos componentes de formulário
	import ServiceForm from './service-form.svelte';
	import CustomerForm from './customer-form.svelte';

	// 1. Props (Svelte 5)
	let {
		open,
		customers = [],
		services = [],
		selectedDate,
		data,
		onSuccess
	} = $props<{
		open: boolean;
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
	let isSearchingCustomer = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

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

	$effect(() => {
		if (!open) {
			// Aguardamos a animação de fechamento do modal (ex: 200ms)
			// para o usuário não ver os campos "limpando" visualmente
			setTimeout(() => {
				// 1. Limpa os estados internos do formulário
				customerId = '';
				serviceId = '';
				customerSearch = '';
				serviceSearch = ''; // Não esqueça de limpar a busca de serviço também

				// 2. Manipula a URL para remover o filtro de busca
				const newUrl = new URL(page.url);

				if (newUrl.searchParams.has('q')) {
					newUrl.searchParams.delete('q');

					// 3. Atualiza a URL sem recarregar a página e sem scroll
					goto(newUrl.search, {
						replaceState: true,
						noScroll: true,
						keepFocus: false
					});
				}
			}, 0);
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
		const id = service?.id || service;

		// Extraímos o ID do objeto ou da string

		if (id) {
			serviceId = id; // Seleciona automaticamente
			serviceSearch = ''; // Limpa a busca do Command
			openService = false; // Fecha o popover da agenda
		}

		showServiceModal = false; // Fecha o modal de criação
	}
	function handleCustomerSearch(e: Event) {
		isSearchingCustomer = true;
		customerSearch = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimeout);

		searchTimeout = setTimeout(() => {
			const newUrl = new URL(page.url);
			if (customerSearch) newUrl.searchParams.set('q', customerSearch);
			else newUrl.searchParams.delete('q');

			// O 'goto' dispara o re-load do servidor (+page.server.ts)
			goto(newUrl.search, {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			}).finally(() => {
				isSearchingCustomer = false;
			});
		}, 300);
	}
</script>

<form
	method="POST"
	action="?/create"
	class="grid gap-6 px-6 py-6"
	use:enhance={() => {
		isLoading = true;
		return async ({ result, update }) => {
			await update();
			isLoading = false;

			if (result.type === 'success') {
				// Toast de sucesso removido
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
						<!-- Truncate no botão principal para nomes longos -->
						<span class="max-w-50! truncate xs:max-w-xs!">
							{selectedCustomerName}
						</span>
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
				<Command.Root shouldFilter={false}>
					<Command.Input
						placeholder="Buscar cliente..."
						value={customerSearch}
						oninput={handleCustomerSearch}
					/>
					<Command.List>
						{#if isSearchingCustomer}
							<div
								class="flex animate-in items-center justify-center gap-2 border-b bg-muted/30 py-2 text-xs text-muted-foreground duration-200 fade-in"
							>
								<LoaderCircle class="size-3 animate-spin" />
								Buscando clientes...
							</div>
						{/if}
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
							{#each customers.slice(0, 5) as customer (customer.id)}
								<Command.Item
									value={customer.name}
									class="flex max-w-65! min-w-0 cursor-pointer items-center xs:max-w-xs!"
									onSelect={() => {
										customerId = customer.id;
										openCustomer = false;
									}}
								>
									<Check
										class={cn(
											'mr-2 size-4 shrink-0',
											customerId !== customer.id && 'text-transparent'
										)}
									/>
									<!-- Truncate na lista de sugestões -->
									<span class="truncate">
										{customer.name}
									</span>
								</Command.Item>
							{/each}
						</Command.Group>
						{#if customers.length > 5}
							<div
								class="border-t bg-muted/5 px-2 py-2 text-center text-[10px] font-medium tracking-widest text-muted-foreground/50 uppercase"
							>
								Refine a busca para ver mais
							</div>
						{/if}
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
	<!-- serviço -->
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
						<!-- CORREÇÃO: Usando a variável de serviço em vez de cliente -->
						<span class="max-w-50! truncate xs:max-w-xs!">
							{selectedServiceName}
						</span>
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
									class="flex max-w-65! min-w-0 cursor-pointer items-center xs:max-w-xs!"
									value={service.name}
									onSelect={() => {
										serviceId = service.id;
										openService = false;
									}}
								>
									<Check
										class={cn(
											'mr-2 size-4 shrink-0',
											serviceId !== service.id && 'text-transparent'
										)}
									/>
									<!-- Layout interno com truncagem para nomes longos de serviço -->
									<div class="flex min-w-0 flex-1 items-center justify-between">
										<span class="truncate">{service.name}</span>
										<span class="ml-2 shrink-0 text-xs text-muted-foreground">
											{service.duration} min
										</span>
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
				Salvar Agendamento
			{/if}
		</Button>
	</div>
</form>

<!-- Componentes de criação rápida -->
<ServiceForm
	bind:open={showServiceModal}
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
