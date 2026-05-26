<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		LoaderCircle,
		User,
		Briefcase,
		Clock,
		Calendar as CalendarIcon,
		X,
		Check,
		Plus,
		UserRoundPlus
	} from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { createFormatters, dateUtils } from '$lib/utils/date';
	import CustomerForm from '../customer-form.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import TimeSlotsSuggestions from '$lib/components/app/time-picker.svelte';
	import { toast } from 'svelte-sonner';

	// Props
	let {
		data,
		open = $bindable(),
		initialTime = '',
		onSuccess
	} = $props<{
		data: any;
		open: boolean;
		initialTime?: string;
		onSuccess: () => void;
	}>();

	// ── Mapeamento estático para o Tailwind gerar as classes ──────
	const colorMap: Record<string, string> = {
		zinc: 'bg-zinc-500',
		blue: 'bg-blue-500',
		indigo: 'bg-indigo-500',
		violet: 'bg-violet-500',
		rose: 'bg-rose-500',
		amber: 'bg-amber-500',
		emerald: 'bg-emerald-500'
	};

	// Estado do formulário
	let formState = $state({
		customerId: '',
		serviceId: '',
		date: data.selectedDate || dateUtils.today(),
		start_at: '',
		notes: ''
	});
	let showCustomerModal = $state(false);

	// Estados de Busca Local de Clientes
	let customerQuery = $state('');
	let isSearching = $state(false);
	let localCustomers = $state<Array<{ id: string; name: string }>>([]);
	let searchTimeout: ReturnType<typeof setTimeout>;
	let selectedCustomer = $state<{ id: string; name: string } | null>(null);

	// Trigger da busca inicial ao abrir
	$effect(() => {
		if (open && !customerQuery) {
			fetch('/api/customers?q=')
				.then((res) => res.json())
				.then((data) => {
					localCustomers = data;
				})
				.catch(() => {});
		}
	});

	// Sincroniza o initialTime quando ele muda
	$effect(() => {
		if (open) {
			formState.start_at = initialTime;
			formState.date = data.selectedDate || dateUtils.today();
		}
	});

	// Busca os clientes na API Route com Debounce
	function handleSearch(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		customerQuery = val;
		isSearching = true;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			try {
				const res = await fetch(`/api/customers?q=${encodeURIComponent(val)}`);
				if (res.ok) {
					localCustomers = await res.json();
				}
			} catch {
				// Erro silenciado para manter comportamento constante
			} finally {
				isSearching = false;
			}
		}, 250);
	}

	let isSubmitting = $state(false);

	$effect(() => {
		if (data.services?.length === 1) {
			formState.serviceId = data.services[0].id;
		}
	});

	const selectedService = $derived(data.services.find((s) => s.id === formState.serviceId));

	const end_at = $derived.by(() => {
		if (!formState.start_at || !selectedService) return '';
		const [h, m] = formState.start_at.split(':').map(Number);
		const totalMinutes = h * 60 + m + selectedService.duration;
		const fh = Math.floor(totalMinutes / 60)
			.toString()
			.padStart(2, '0');
		const fm = (totalMinutes % 60).toString().padStart(2, '0');
		return `${fh}:${fm}`;
	});

	function handleTimeInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, '');
		if (value.length > 4) value = value.slice(0, 4);
		if (value.length >= 2) {
			let hours = parseInt(value.slice(0, 2));
			if (hours > 23) value = '23' + value.slice(2);
		}
		if (value.length === 4) {
			let mins = parseInt(value.slice(2, 4));
			if (mins > 59) value = value.slice(0, 2) + '59';
		}
		if (value.length >= 3) {
			value = value.slice(0, 2) + ':' + value.slice(2);
		}
		formState.start_at = value;
		input.value = value;
	}

	$effect(() => {
		if (!open) {
			formState.customerId = '';
			formState.notes = '';
			customerQuery = '';
			selectedCustomer = null;
			localCustomers = [];
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[92dvh] w-[94vw] flex-col overflow-hidden rounded-[32px] p-0 shadow-2xl sm:max-w-[450px]"
	>
		<div class="px-6 py-4 pb-1">
			<h2 class="text-xl font-bold">Novo Agendamento</h2>
		</div>

		<div class="no-scrollbar overflow-y-auto">
			<form
				method="POST"
				action="?/create"
				use:enhance={({ formData }) => {
					isSubmitting = true;
					const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
					formData.append('tz', clientTz);
					return async ({ result, update }) => {
						await update();
						isSubmitting = false;
						if (result.type === 'success') {
							onSuccess();
							open = false;
						} else if (result.type === 'failure' && result.data?.message) {
							// Dispara o toast usando o seu gerenciador de estado global ui
							// Altere o método (.toast, .error, .notify) de acordo com a assinatura real do seu arquivo ui.svelte
							toast.error(result.data.message, 'error');
						}
					};
				}}
				class="flex flex-col space-y-6 p-6 pt-0 pb-4"
			>
				<input type="hidden" name="customer_id" value={formState.customerId} />
				<input type="hidden" name="service_id" value={formState.serviceId} />
				<input type="hidden" name="end_at" value={end_at} />
				<input type="hidden" name="date" value={formState.date} />

				<div class="space-y-3">
					<div class="flex items-center justify-between px-1">
						<div class="flex items-center gap-2 text-zinc-400">
							<User size={14} />
							<Label class="text-[10px] font-bold tracking-widest uppercase">Cliente</Label>
						</div>
						{#if isSearching}
							<LoaderCircle size={12} class="animate-spin text-zinc-400" />
						{/if}
					</div>

					<!-- Área de Chips assíncronos -->
					<div class="group h-6.5">
						<div
							class="no-scrollbar flex flex-nowrap items-center gap-2 overflow-x-auto scroll-smooth pb-1"
							onwheel={(e) => {
								if (e.deltaY !== 0) {
									e.preventDefault();
									e.currentTarget.scrollLeft += e.deltaY;
								}
							}}
						>
							<!-- 1. Cliente Selecionado Localmente -->
							{#if selectedCustomer}
								<button
									type="button"
									onclick={() => {
										formState.customerId = '';
										selectedCustomer = null;
										customerQuery = '';
									}}
									class="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-zinc-900 bg-zinc-900 py-1 pr-1 pl-2 text-white shadow-md transition-all active:scale-95"
								>
									<span class="text-xs font-medium whitespace-nowrap">{selectedCustomer.name}</span>
									<Check size={12} />
								</button>
							{/if}

							<!-- 2. Lista vinda do estado local (localCustomers) -->
							{#each localCustomers
								.filter((c) => c.id !== formState.customerId)
								.slice(0, 10) as customer}
								<button
									type="button"
									onclick={() => {
										formState.customerId = customer.id;
										selectedCustomer = customer;
										customerQuery = '';
									}}
									class="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-zinc-600 transition-all hover:border-zinc-200 active:scale-95"
								>
									<span class="text-xs font-medium whitespace-nowrap">{customer.name}</span>
								</button>
							{/each}

							<!-- 3. Feedback inline quando a busca não retornar nada -->
							{#if customerQuery && !isSearching && localCustomers.filter((c) => c.id !== formState.customerId).length === 0}
								<span
									class="flex shrink-0 items-center pr-1 text-xs font-medium whitespace-nowrap text-zinc-400"
								>
									Nenhum resultado
								</span>
								<button
									type="button"
									onclick={() => (showCustomerModal = true)}
									class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-all active:scale-95"
								>
									<Plus size={12} />
									Criar "{customerQuery}"
								</button>
							{/if}
						</div>
					</div>

					<!-- Input de Busca Inteligente / Botão de Criar -->
					<div class="relative">
						<!-- Ícone Dinâmico à Esquerda -->
						<!-- Botão de Criação Sempre Visível à Esquerda -->
						<button
							type="button"
							onclick={() => (showCustomerModal = true)}
							title="Criar novo cliente"
							class="absolute top-1/2 left-2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border border-neutral-800 bg-black text-neutral-50 transition-colors before:absolute before:-inset-2 before:cursor-pointer hover:bg-neutral-900 hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
						>
							<UserRoundPlus size={14} class="stroke-[2]" />
						</button>

						<Input
							placeholder="Nome, telefone ou criar"
							bind:value={customerQuery}
							oninput={handleSearch}
							class="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-10 focus:bg-white"
						/>

						<!-- Botão de Limpar à Direita -->
						{#if customerQuery}
							<button
								type="button"
								onclick={() => {
									customerQuery = '';
									localCustomers = [];
								}}
								class="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
							>
								<X size={16} />
							</button>
						{/if}
					</div>
				</div>

				<!-- SEÇÃO SERVIÇO -->
				{#if data.services.length > 1}
					<div class="space-y-3">
						<div class="flex items-center gap-2 px-1 text-zinc-400">
							<Briefcase size={14} />
							<Label class="text-[10px] font-bold tracking-widest uppercase">Serviço</Label>
						</div>

						<div
							class="grid gap-2
			{data.services.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}"
						>
							{#each data.services as service}
								<button
									type="button"
									onclick={() => (formState.serviceId = service.id)}
									class="flex min-w-0 cursor-pointer items-center gap-2 rounded-2xl border px-3 py-3 transition-all
					{formState.serviceId === service.id
										? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
										: 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200'}"
									title={service.name}
								>
									<div
										class="size-2 shrink-0 rounded-full {colorMap[service.color] ?? 'bg-zinc-300'}"
									></div>

									<span class="w-full truncate text-left text-xs font-bold">{service.name}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- SEÇÃO DATA E INÍCIO -->
				<div class="space-y-3">
					<div class="flex items-center gap-2 px-1 text-zinc-400">
						<Clock size={14} />
						<Label class="text-[10px] font-bold tracking-widest uppercase">Data e Início</Label>
					</div>

					<div class="h-7 px-1">
						{#if formState.serviceId}
							<TimeSlotsSuggestions
								{data}
								bind:start_at={formState.start_at}
								selectedDate={formState.date}
								serviceId={formState.serviceId}
							/>
						{/if}
					</div>

					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => (ui.isDatePickerOpen = true)}
							class="relative flex h-12 flex-1 cursor-pointer items-center rounded-2xl border border-zinc-100 bg-zinc-50/50 pr-3 pl-10 transition-all hover:border-zinc-200 active:scale-[0.98]"
						>
							<CalendarIcon size={16} class="absolute left-4 text-zinc-400" />
							<span class="block truncate text-xs font-bold text-zinc-600 uppercase">
								{#if formState.date === dateUtils.today()}
									Hoje
								{:else}
									{createFormatters(data.timezone)
										.header.format(dateUtils.parseISO(formState.date))
										.replace('.', '')}
								{/if}
							</span>
						</button>

						<div class="relative w-[105px] shrink-0">
							<Input
								type="text"
								inputmode="numeric"
								placeholder="00:00"
								name="start_at"
								maxlength={5}
								bind:value={formState.start_at}
								oninput={handleTimeInput}
								class="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-9 text-base font-medium focus:bg-white"
							/>
							<Clock size={16} class="absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400" />
						</div>
					</div>
				</div>

				<div>
					<Button
						type="submit"
						disabled={isSubmitting ||
							!formState.start_at ||
							!formState.customerId ||
							!formState.serviceId}
						class="h-14 w-full cursor-pointer rounded-[20px] bg-zinc-900 text-base font-bold shadow-lg transition-all active:scale-[0.97]"
					>
						{#if isSubmitting}
							<LoaderCircle class="mr-2 size-5 animate-spin" />
							Salvando...
						{:else}
							Agendar Horário
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>

<CustomerForm
	bind:open={showCustomerModal}
	initialData={{ name: customerQuery, phone: '' }}
	onSuccess={(newCustomer) => {
		// Checa se newCustomer existe E se tem um ID válido
		if (newCustomer && newCustomer.id) {
			formState.customerId = newCustomer.id;
			selectedCustomer = {
				id: newCustomer.id,
				name: newCustomer.name
			};
		} else {
			// Opcional: Um aviso se o backend falhar em devolver o ID
			toast.error('Cliente salvo, mas ID não retornado.');
		}
		customerQuery = '';
		showCustomerModal = false;
	}}
/>
