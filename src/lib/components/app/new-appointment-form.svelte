<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		LoaderCircle,
		User,
		Briefcase,
		Clock,
		Calendar as CalendarIcon,
		Search,
		X,
		Check,
		Plus
	} from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { dateUtils, fmt } from '$lib/utils/date';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CustomerForm from './customer-form.svelte';
	import { ui } from '$lib/state/ui.svelte';

	// Props
	let {
		data,
		open = $bindable(), // Permite que o pai feche o modal ou reaja à abertura
		initialTime = '',
		onSuccess
	} = $props<{
		data: any;
		open: boolean;
		initialTime?: string;
		onSuccess: () => void;
	}>();

	// Estado do formulário
	let formState = $state({
		customerId: '',
		serviceId: '',
		date: data.selectedDate || dateUtils.today(),
		start_at: '',
		notes: ''
	});
	let showCustomerModal = $state(false);

	// Sincroniza o initialTime quando ele muda (ex: clique em Ghost Slot)
	$effect(() => {
		if (open) {
			formState.start_at = initialTime;
			formState.date = data.selectedDate || dateUtils.today();
		}
	});

	// Estados de Busca
	let customerQuery = $state('');
	let isSearching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Encontra o cliente selecionado para mostrar no estado "selecionado"
	let selectedCustomer = $derived(data.customers.find((c) => c.id === formState.customerId));

	function handleSearch(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		customerQuery = val;
		isSearching = true;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const newUrl = new URL(page.url);
			if (val) newUrl.searchParams.set('q', val);
			else newUrl.searchParams.delete('q');

			goto(newUrl.search, {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			}).finally(() => {
				isSearching = false;
			});
		}, 300); // 300ms de debounce para não sobrecarregar o servidor
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

		// Validação robusta de horas (primeiros 2 dígitos)
		if (value.length >= 2) {
			let hours = parseInt(value.slice(0, 2));
			if (hours > 23) value = '23' + value.slice(2);
		}

		// Validação robusta de minutos (últimos 2 dígitos)
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
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[92dvh] w-[94vw] flex-col overflow-hidden rounded-[32px] p-0 shadow-2xl sm:max-w-[450px]"
	>
		<div class="px-6 py-4 pb-1">
			<h2 class="text-xl font-bold">Novo Agendamento</h2>
			<!--<p class="text-sm text-zinc-500 capitalize">
				{dateUtils.getHeaderLabel(data.selectedDate)}
			</p>-->
		</div>

		<div class="no-scrollbar overflow-y-auto">
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'success') {
							onSuccess();
							open = false;
							formState.customerId = ''; // Limpa após sucesso
							customerQuery = '';
						}
					};
				}}
				class="flex flex-col space-y-6 p-6 pt-0 pb-4"
			>
				<input type="hidden" name="customer_id" value={formState.customerId} />
				<input type="hidden" name="end_at" value={end_at} />
				<input type="hidden" name="date" value={formState.date} />

				<!-- SEÇÃO CLIENTE COM CHIPS -->
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

					<!-- Área de Chips (Agora com Scroll Horizontal) -->
					<div class="group h-6.5">
						<div
							class="no-scrollbar flex flex-nowrap items-center gap-2 overflow-x-auto scroll-smooth pb-1"
						>
							<!-- 1. SEMPRE PRIMEIRO: Cliente Selecionado -->
							{#if selectedCustomer}
								<button
									type="button"
									onclick={() => {
										formState.customerId = '';
										customerQuery = '';
									}}
									class="flex shrink-0 items-center gap-2 rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-white shadow-md transition-all active:scale-95"
								>
									<span class="text-xs font-medium whitespace-nowrap">{selectedCustomer.name}</span>
									<Check size={12} />
								</button>
							{/if}

							<!-- 2. Lista dos demais clientes (Filtrada) -->
							{#each data.customers
								.filter((c) => c.id !== formState.customerId)
								.slice(0, 10) as customer}
								<button
									type="button"
									onclick={() => {
										formState.customerId = customer.id;
										customerQuery = '';
									}}
									class="flex shrink-0 items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-zinc-600 transition-all hover:border-zinc-200 active:scale-95"
								>
									<span class="text-xs font-medium whitespace-nowrap">{customer.name}</span>
								</button>
							{/each}

							<!-- 3. SEMPRE POR ÚLTIMO: Botão de Criar -->
							{#if customerQuery && !isSearching}
								<button
									type="button"
									onclick={() => (showCustomerModal = true)}
									class="flex shrink-0 items-center gap-2 rounded-full border border-dashed border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 transition-all active:scale-95"
								>
									<Plus size={12} />
									<span class="text-xs font-bold whitespace-nowrap">Criar "{customerQuery}"</span>
								</button>
							{/if}
						</div>
					</div>

					<!-- Input de Busca -->
					<div class="relative">
						<Input
							placeholder="Buscar cliente..."
							bind:value={customerQuery}
							oninput={handleSearch}
							class="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-10 focus:bg-white"
						/>
						<Search size={16} class="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400" />

						{#if customerQuery}
							<button
								type="button"
								onclick={() => {
									customerQuery = '';
									handleSearch({ target: { value: '' } } as any);
								}}
								class="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400"
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
						<div class="grid grid-cols-1 gap-2">
							{#each data.services as service}
								<button
									type="button"
									onclick={() => (formState.serviceId = service.id)}
									class="flex items-center justify-between rounded-2xl border px-4 py-3 transition-all
                                    {formState.serviceId === service.id
										? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
										: 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200'}"
								>
									<div class="flex items-center gap-3">
										<div
											class="size-2 rounded-full"
											style="background: {service.color || '#e4e4e7'}"
										></div>
										<span class="text-sm font-bold">{service.name}</span>
									</div>
									<span class="text-xs opacity-60">{service.duration} min</span>
								</button>
							{/each}
						</div>
					</div>
				{:else if data.services.length === 1}
					<!-- Se houver apenas um, mantemos o input oculto para o POST funcionar -->
					<input type="hidden" name="service_id" value={data.services[0].id} />
				{/if}

				<div class="space-y-2">
					<Label class="px-1 text-[10px] font-bold text-zinc-400 uppercase">Data e Início</Label>

					<div class="flex gap-2">
						<!-- Input de Data (Estilo reduzido para o lado) -->
						<button
							type="button"
							onclick={() => (ui.isDatePickerOpen = true)}
							class="relative flex h-12 w-[140px] shrink-0 items-center rounded-2xl border border-zinc-100 bg-zinc-50/50 pr-3 pl-10 transition-all hover:border-zinc-200 active:scale-[0.98]"
						>
							<CalendarIcon size={16} class="absolute left-4 text-zinc-400" />
							<span class="block truncate text-xs font-bold text-zinc-600 uppercase">
								{#if formState.date === dateUtils.today()}
									Hoje
								{:else}
									<!-- Usando os formatadores que você já tem no arquivo -->
									{fmt.header.format(dateUtils.parseISO(formState.date)).replace('.', '')}
								{/if}
							</span>
						</button>

						<!-- Input Inteligente de Hora -->
						<div class="relative flex-1">
							<Input
								type="text"
								inputmode="numeric"
								placeholder="00:00"
								name="start_at"
								maxlength="5"
								value={formState.start_at}
								oninput={handleTimeInput}
								class="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-10 text-base font-medium focus:bg-white"
							/>
							<Clock size={16} class="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400" />
						</div>
					</div>
				</div>

				{#if end_at}
					<div class="rounded-2xl bg-zinc-50 py-3 text-center transition-all">
						<p class="text-[11px] font-medium text-zinc-500">
							Término previsto às <span class="text-sm font-bold text-zinc-900">{end_at}</span>
						</p>
					</div>
				{/if}

				<div class="space-y-2">
					<Label class="px-1 text-[10px] font-bold text-zinc-400 uppercase">Notas</Label>
					<Textarea
						name="notes"
						bind:value={formState.notes}
						placeholder="Algum detalhe importante?"
						class="min-h-[80px] resize-none rounded-2xl border-zinc-100 bg-zinc-50/50"
					/>
				</div>

				<div>
					<Button
						type="submit"
						disabled={isSubmitting ||
							!formState.start_at ||
							!formState.customerId ||
							!formState.serviceId}
						class="h-14 w-full rounded-[20px] bg-zinc-900 text-base font-bold shadow-lg transition-all active:scale-[0.97]"
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
	formData={data.customerForm}
	initialName={customerQuery}
	onSuccess={(newCustomer) => {
		// Assume que o onSuccess retorna o objeto do cliente ou o ID
		const id = newCustomer?.id || newCustomer;
		formState.customerId = id;
		customerQuery = '';
		showCustomerModal = false;
	}}
/>
