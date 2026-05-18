<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { Plus, Search, ChevronRight, LoaderCircle } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	// --- Estados ---
	let open = $state(false);
	let isLoading = $state(false);
	let isConfirmingDelete = $state(false);
	let isSearching = $state(false);
	let searchQuery = $state(data.q || '');
	let formState = $state({ id: '', name: '', phone: '' });
	let apiCustomers = $state<any[]>([]);

	// --- Reatividade ---
	$effect(() => {
		if (!open) {
			isConfirmingDelete = false;
			if (!ui.isModalOpen) {
				isConfirmingDelete = false;
			}
		}
	});

	let currentCustomers = $derived(searchQuery.trim() !== '' ? apiCustomers : data.customers);

	let filteredCustomers = $derived(
		currentCustomers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(c.phone && c.phone.includes(searchQuery))
		)
	);

	// --- Ações ---
	function startCreate() {
		formState = { id: '', name: '', phone: '' };
		open = true;
	}

	function startEdit(customer: any) {
		formState = { id: customer.id, name: customer.name, phone: customer.phone };
		open = true;
	}

	let searchTimeout: any;
	function handleSearch(e: Event) {
		const value = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimeout);

		if (!value.trim()) {
			isSearching = false;
			apiCustomers = [];
			return;
		}

		isSearching = true;

		searchTimeout = setTimeout(async () => {
			try {
				const response = await fetch(`/api/customers?q=${encodeURIComponent(value)}`);
				if (response.ok) {
					apiCustomers = await response.json();
				} else {
					console.error('Erro ao buscar clientes na API');
				}
			} catch (err) {
				console.error('Erro de rede ao buscar clientes:', err);
			} finally {
				isSearching = false;
			}
		}, 300);
	}

	function handlePhoneInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		let val = input.value.replace(/\D/g, '').slice(0, 11);
		formState.phone = val;
		input.value = formatPhone(val);
	}

	function formatPhone(v: string) {
		if (!v) return '';
		let val = v.replace(/\D/g, '');
		if (val.length > 7) return `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
		if (val.length > 2) return `(${val.slice(0, 2)}) ${val.slice(2)}`;
		return val;
	}

	function getInitials(nameStr: string) {
		const name = nameStr?.trim();
		if (!name) return '?';
		const parts = name.split(/\s+/);
		const first = parts[0][0];
		const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
		return (first + last).toUpperCase();
	}

	// --- Geração Dinâmica de Cores Premium ---
	function getAvatarColors(nameStr: string) {
		if (!nameStr) return { bg: 'hsl(0, 0%, 96%)', text: 'hsl(0, 0%, 45%)' }; // Fallback neutro

		let hash = 0;
		for (let i = 0; i < nameStr.length; i++) {
			hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
		}

		const h = Math.abs(hash) % 360; // Espectro completo (0 a 360 graus)

		// Saturação controlada (45-55%) e Luminosidade balanceada garantem o tom suave/SaaS
		return {
			bg: `hsl(${h}, 45%, 92%)`,
			text: `hsl(${h}, 55%, 35%)`
		};
	}
</script>

<div class="flex h-full flex-col">
	<header class="flex flex-col gap-4 px-6 pt-8 pb-4">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight text-zinc-900">Clientes</h1>
			<p class="text-sm text-zinc-500">Sua base de contatos</p>
		</div>

		<div class="relative mt-2">
			{#if isSearching}
				<LoaderCircle class="absolute top-3.5 left-4 size-4 animate-spin text-zinc-400" />
			{:else}
				<Search class="absolute top-3.5 left-4 size-4 text-zinc-400" />
			{/if}

			<Input
				type="search"
				placeholder="Buscar por nome ou celular..."
				class="h-11 rounded-[16px] border-none bg-zinc-100/80 pl-11 text-[15px] transition-colors placeholder:text-zinc-400 focus-visible:bg-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-200"
				bind:value={searchQuery}
				oninput={handleSearch}
			/>
		</div>
	</header>

	<div class="flex-1 space-y-2 overflow-y-auto px-4 pb-32">
		{#each filteredCustomers as customer (customer.id)}
			{@const colors = getAvatarColors(customer.name)}
			<button
				onclick={() => startEdit(customer)}
				class="group flex w-full items-center gap-4 rounded-[20px] border border-zinc-100/60 bg-white p-3.5 transition-all duration-200 hover:border-zinc-200 active:scale-[0.98] active:bg-zinc-50/50"
			>
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tracking-wide transition-transform group-hover:scale-105"
					style="background-color: {colors.bg}; color: {colors.text};"
				>
					{getInitials(customer.name)}
				</div>
				<div class="min-w-0 flex-1 text-left">
					<p class="truncate text-[15px] font-semibold tracking-tight text-zinc-900">
						{customer.name}
					</p>
					<p class="text-[13px] font-medium text-zinc-400">{formatPhone(customer.phone)}</p>
				</div>
				<ChevronRight
					class="size-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
				/>
			</button>
		{:else}
			<div class="py-20 text-center px-4">
				{#if isSearching}
					<p class="text-sm font-medium text-zinc-400 animate-pulse">Buscando clientes...</p>
				{:else if searchQuery.trim()}
					<p class="text-sm text-zinc-500">
						Nenhum cliente encontrado para <span class="font-semibold text-zinc-800"
							>"{searchQuery}"</span
						>.
					</p>
				{:else}
					<p class="text-sm text-zinc-500">Nenhum cliente cadastrado.</p>
				{/if}
			</div>
		{/each}

		{#if !isSearching && searchQuery.trim() !== '' && filteredCustomers.length >= 50}
			<p class="py-6 text-center text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
				Mostrando os primeiros 100 resultados.
			</p>
		{/if}
	</div>
</div>

<div class="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style="bottom: 100px">
	<div class="relative flex w-full max-w-md justify-end px-6">
		<button
			onclick={startCreate}
			class="pointer-events-auto flex size-[52px] items-center justify-center rounded-full border border-zinc-200/50 bg-white text-zinc-900 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-90"
			aria-label="Novo cliente"
		>
			<Plus class="size-6" />
		</button>
	</div>
</div>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[28px] border-zinc-100 bg-white p-0 shadow-2xl sm:max-w-[400px]"
	>
		<Dialog.Header class="px-6 py-6 text-left">
			<Dialog.Title class="text-xl font-bold tracking-tight text-zinc-900"
				>{formState.id ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title
			>
		</Dialog.Header>

		<form
			method="POST"
			action="?/upsert"
			class="flex flex-col"
			use:enhance={() => {
				isLoading = true;
				return async ({ result, update }) => {
					await update();
					isLoading = false;

					if (result.type === 'success') {
						toast.success(formState.id ? 'Atualizado com sucesso' : 'Criado com sucesso');
						open = false;
					}

					if (result.type === 'failure') {
						const message = result.data?.message || 'Ocorreu um erro inesperado';
						toast.error(message);
						isConfirmingDelete = false;
					}

					if (result.type === 'error') {
						toast.error('Erro de conexão ou erro interno do servidor');
					}
				};
			}}
		>
			<div class="space-y-5 px-6 pb-8">
				<input type="hidden" name="id" value={formState.id} />

				<div class="space-y-1.5">
					<Label class="text-[11px] font-bold tracking-wider text-zinc-500 uppercase"
						>Nome Completo</Label
					>
					<Input
						name="name"
						bind:value={formState.name}
						required
						class="h-12 rounded-[16px] border-zinc-200/80 bg-zinc-50/50 focus-visible:bg-white focus-visible:ring-zinc-300"
					/>
				</div>

				<div class="space-y-1.5">
					<Label class="text-[11px] font-bold tracking-wider text-zinc-500 uppercase"
						>WhatsApp</Label
					>
					<Input
						class="h-12 rounded-[16px] border-zinc-200/80 bg-zinc-50/50 focus-visible:bg-white focus-visible:ring-zinc-300"
						value={formatPhone(formState.phone)}
						oninput={handlePhoneInput}
						inputmode="numeric"
						required
					/>
					<input type="hidden" name="phone" value={formState.phone} />
				</div>
			</div>

			<div
				class="flex gap-3 border-t border-zinc-100 bg-zinc-50/30 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
			>
				{#if formState.id}
					<Button
						type={isConfirmingDelete ? 'submit' : 'button'}
						variant="destructive"
						formaction="?/delete"
						onclick={(e) => {
							if (!isConfirmingDelete) {
								e.preventDefault();
								isConfirmingDelete = true;
							}
						}}
						class="h-12 flex-1 rounded-[16px] font-semibold transition-all"
					>
						{isConfirmingDelete ? 'Confirmar' : 'Excluir'}
					</Button>
				{/if}

				<Button
					type="submit"
					disabled={isLoading}
					class="h-12 flex-[2] rounded-[16px] bg-zinc-900 font-semibold text-white transition-all hover:bg-zinc-800"
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 size-4 animate-spin" />
						Salvando
					{:else}
						Salvar Cliente
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(body) {
		background-color: #fafafa; /* Fundo levemente off-white ajuda os cards brancos a se destacarem */
	}
</style>
