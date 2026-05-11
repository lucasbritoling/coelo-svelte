<script lang="ts">
	import {
		Check,
		ChevronsUpDown,
		LoaderCircle,
		Plus,
		User,
		Briefcase,
		Calendar as CalendarIcon,
		Notebook
	} from '@lucide/svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Componentes internos e lógica
	import TimePicker from './time-picker.svelte';
	import ServiceForm from './service-form.svelte';
	import CustomerForm from './customer-form.svelte';

	// 1. Props
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

	// 2. Estados do Formulário
	let formState = $state({
		customerId: '',
		serviceId: '',
		date: selectedDate,
		time: '',
		notes: ''
	});

	// 3. Estados de Controle de UI
	let openCustomerPopover = $state(false);
	let openServicePopover = $state(false);
	let showServiceModal = $state(false);
	let showCustomerModal = $state(false);
	let isSearchingCustomer = $state(false);
	let isLoading = $state(false);
	let customerSearch = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// 4. Derivados para Labels
	let selectedCustomerName = $derived(
		customers.find((c) => c.id === formState.customerId)?.name ?? 'Buscar cliente...'
	);
	let selectedServiceName = $derived(
		services.find((s) => s.id === formState.serviceId)?.name ?? 'Qual o serviço?'
	);

	// 5. Handlers de Busca (Preservando sua lógica de URL)
	function handleCustomerSearch(e: Event) {
		isSearchingCustomer = true;
		customerSearch = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimeout);

		searchTimeout = setTimeout(() => {
			const newUrl = new URL(page.url);
			if (customerSearch) newUrl.searchParams.set('q', customerSearch);
			else newUrl.searchParams.delete('q');

			goto(newUrl.search, {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			}).finally(() => {
				isSearchingCustomer = false;
			});
		}, 300);
	}

	// Callbacks de Criação
	function handleCustomerCreated(customer: any) {
		formState.customerId = customer?.id || customer;
		showCustomerModal = false;
		openCustomerPopover = false;
	}

	function handleServiceCreated(service: any) {
		formState.serviceId = service?.id || service;
		showServiceModal = false;
		openServicePopover = false;
	}
</script>

<form
	method="POST"
	action="?/create"
	class="flex flex-col gap-6 px-6 py-6"
	use:enhance={() => {
		isLoading = true;
		return async ({ result, update }) => {
			isLoading = false;
			if (result.type === 'success') {
				onSuccess?.();
				await update({ invalidateAll: true });
			} else if (result.type === 'failure') {
				toast.error(result.data?.message ?? 'Erro ao agendar.');
			}
		};
	}}
>
	<input type="hidden" name="customer_id" value={formState.customerId} />
	<input type="hidden" name="service_id" value={formState.serviceId} />
	<input type="hidden" name="date" value={formState.date} />
	<input type="hidden" name="start_at" value={formState.time} />
	<div class="grid gap-2">
		<div class="flex items-center gap-2 text-muted-foreground/80">
			<User class="size-3.5" />
			<Label class="text-[10px] font-bold tracking-widest uppercase">Cliente</Label>
		</div>
		<Popover.Root bind:open={openCustomerPopover}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="h-11 w-full justify-between rounded-xl bg-zinc-50/50 font-normal dark:bg-zinc-900/50"
					>
						<span class="truncate">{selectedCustomerName}</span>
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
				<Command.Root shouldFilter={false}>
					<Command.Input
						placeholder="Nome ou telefone..."
						value={customerSearch}
						oninput={handleCustomerSearch}
					/>
					<Command.List>
						{#if isSearchingCustomer}
							<div class="flex items-center justify-center py-2 text-xs text-muted-foreground">
								<LoaderCircle class="mr-2 size-3 animate-spin" /> Buscando...
							</div>
						{/if}
						<Command.Empty>
							<div class="flex flex-col items-center gap-2 p-4">
								<p class="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
								<Button size="sm" class="w-full" onclick={() => (showCustomerModal = true)}>
									<Plus class="mr-2 size-3" /> Criar "{customerSearch}"
								</Button>
							</div>
						</Command.Empty>
						<Command.Group>
							{#each customers as customer}
								<Command.Item
									onSelect={() => {
										formState.customerId = customer.id;
										openCustomerPopover = false;
									}}
								>
									<Check
										class={cn(
											'mr-2 size-4',
											formState.customerId === customer.id ? 'opacity-100' : 'opacity-0'
										)}
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

	<div class="grid gap-2">
		<div class="flex items-center gap-2 text-muted-foreground/80">
			<Briefcase class="size-3.5" />
			<Label class="text-[10px] font-bold tracking-widest uppercase">Serviço</Label>
		</div>
		<Popover.Root bind:open={openServicePopover}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="h-11 w-full justify-between rounded-xl bg-zinc-50/50 font-normal dark:bg-zinc-900/50"
					>
						<span class="truncate">{selectedServiceName}</span>
						<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-[--bits-popover-anchor-width] p-0" align="start">
				<Command.Root>
					<Command.Input placeholder="Buscar serviço..." />
					<Command.List>
						<Command.Empty>
							<Button variant="ghost" class="w-full" onclick={() => (showServiceModal = true)}>
								<Plus class="mr-2 size-3" /> Criar novo serviço
							</Button>
						</Command.Empty>
						<Command.Group>
							{#each services as service}
								<Command.Item
									onSelect={() => {
										formState.serviceId = service.id;
										openServicePopover = false;
									}}
								>
									<Check
										class={cn(
											'mr-2 size-4',
											formState.serviceId === service.id ? 'opacity-100' : 'opacity-0'
										)}
									/>
									<div class="flex flex-1 justify-between">
										<span>{service.name}</span>
										<span class="text-xs opacity-50">{service.duration} min</span>
									</div>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>

	<hr class="border-dashed opacity-50" />

	<div class="grid grid-cols-2 gap-4">
		<div class="grid gap-2">
			<div class="flex items-center gap-2 text-muted-foreground/80">
				<CalendarIcon class="size-3.5" />
				<Label class="text-[10px] font-bold tracking-widest uppercase">Data</Label>
			</div>
			<Input
				type="date"
				bind:value={formState.date}
				class="h-11 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50"
			/>
		</div>

		<TimePicker {data} bind:formState />
	</div>

	<div class="grid gap-2">
		<div class="flex items-center gap-2 text-muted-foreground/80">
			<Notebook class="size-3.5" />
			<Label class="text-[10px] font-bold tracking-widest uppercase">Notas</Label>
		</div>
		<Textarea
			placeholder="Alguma observação importante?"
			bind:value={formState.notes}
			name="notes"
			class="min-h-[80px] resize-none rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50"
		/>
	</div>

	<Button
		type="submit"
		disabled={isLoading || !formState.customerId || !formState.serviceId || !formState.time}
		class="h-12 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
	>
		{#if isLoading}
			<LoaderCircle class="mr-2 size-5 animate-spin" /> Agendando...
		{:else}
			Confirmar Agendamento
		{/if}
	</Button>
</form>

<ServiceForm bind:open={showServiceModal} onSuccess={handleServiceCreated} />
<CustomerForm
	bind:open={showCustomerModal}
	formData={data.customerForm}
	onSuccess={handleCustomerCreated}
/>

<style>
	/* Remove a seta nativa do input date/time para um visual mais limpo no iOS */
	input::-webkit-calendar-picker-indicator {
		display: none;
		-webkit-appearance: none;
	}
</style>
