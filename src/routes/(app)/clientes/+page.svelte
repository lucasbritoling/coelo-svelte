<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { Plus, Search, Trash2, LoaderCircle, ChevronRight, Phone, User } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	// --- Estados ---
	let open = $state(false);
	let isLoading = $state(false);
	let isConfirmingDelete = $state(false);
	let isSearching = $state(false);
	let searchQuery = $state(data.q || '');
	let formState = $state({ id: '', name: '', phone: '' });

	// --- Reatividade ---
	$effect(() => {
		if (!open) {
			// Quando o modal fecha por qualquer motivo (clique fora, esc, sucesso)
			// limpamos o estado de exclusão para a próxima abertura
			isConfirmingDelete = false;

			// Opcional: Limpar o formState também garante que um "Novo Cliente"
			// nunca venha com dados de um anterior se o startCreate falhar
			if (!ui.isModalOpen) {
				isConfirmingDelete = false;
			}
		}
	});

	let filteredCustomers = $derived(
		data.customers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
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
		isSearching = true;
		const value = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			const newUrl = new URL(page.url);
			value ? newUrl.searchParams.set('q', value) : newUrl.searchParams.delete('q');
			goto(newUrl.search, { keepFocus: true, replaceState: true, noScroll: true }).finally(
				() => (isSearching = false)
			);
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
</script>

<div class="flex h-full flex-col bg-white">
	<!-- Header Local Simples (Estilo Agenda) -->
	<header class="flex flex-col gap-4 px-6 pt-8 pb-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-zinc-900">Clientes</h1>
			<p class="text-sm text-zinc-500">Sua base de contatos</p>
		</div>

		<div class="relative">
			<Search
				class="absolute top-3 left-3.5 size-4 {isSearching
					? 'animate-pulse text-blue-500'
					: 'text-zinc-400'}"
			/>
			<Input
				type="search"
				placeholder="Buscar por nome ou celular..."
				class="h-11 rounded-2xl border-none bg-zinc-100 pl-10 focus-visible:ring-zinc-200"
				bind:value={searchQuery}
				oninput={handleSearch}
			/>
		</div>
	</header>

	<!-- Lista de Clientes -->
	<div class="flex-1 space-y-2 overflow-y-auto px-4 pb-32">
		{#each filteredCustomers as customer (customer.id)}
			<button
				onclick={() => startEdit(customer)}
				class="flex w-full items-center gap-4 rounded-[24px] border border-zinc-100 bg-white p-4 transition-all active:scale-[0.97] active:bg-zinc-50"
			>
				<div
					class="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500"
				>
					{customer.name.charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0 flex-1 text-left">
					<p class="truncate font-bold text-zinc-900">{customer.name}</p>
					<p class="font-mono text-xs text-zinc-400">{formatPhone(customer.phone)}</p>
				</div>
				<ChevronRight class="size-4 text-zinc-300" />
			</button>
		{:else}
			<div class="py-20 text-center">
				<p class="text-sm text-zinc-400 italic">Nenhum cliente encontrado.</p>
			</div>
		{/each}

		{#if data.customers.length >= 100}
			<p class="py-4 text-center text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
				Limite de busca atingido
			</p>
		{/if}
	</div>
</div>

<!-- FAB Discreto (Igual ao da Agenda) -->
<button
	onclick={startCreate}
	class="fixed right-6 z-40 flex size-14 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-xl transition-all active:scale-90"
	style="bottom: 100px"
>
	<Plus size={28} />
</button>

<!-- Dialog de Upsert -->
<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[32px] p-0 sm:max-w-[400px]"
	>
		<Dialog.Header class="px-6 py-6 text-left">
			<Dialog.Title class="text-xl font-bold"
				>{formState.id ? 'Editar' : 'Novo Cliente'}</Dialog.Title
			>
		</Dialog.Header>

		<form
			method="POST"
			action="?/upsert"
			class="flex flex-col"
			use:enhance={() => {
				isLoading = true;
				return async ({ result, update }) => {
					// O update() já tenta invalidar, mas as vezes o reset: false interfere
					await update({ reset: true });
					await invalidateAll(); // Força a atualização dos dados do banco

					isLoading = false;
					if (result.type === 'success') {
						toast.success(formState.id ? 'Atualizado' : 'Criado');
						open = false;
					}
				};
			}}
		>
			<div class="space-y-6 px-6 pb-8">
				<input type="hidden" name="id" value={formState.id} />
				<div class="grid gap-2">
					<Label class="text-xs font-bold tracking-widest text-zinc-400 uppercase">Nome</Label>
					<Input
						name="name"
						bind:value={formState.name}
						required
						class="h-12 rounded-2xl border-none bg-zinc-50"
					/>
				</div>
				<div class="grid gap-2">
					<Label class="text-xs font-bold tracking-widest text-zinc-400 uppercase">WhatsApp</Label>
					<Input
						class="h-12 rounded-2xl border-none bg-zinc-50 font-mono"
						value={formatPhone(formState.phone)}
						oninput={handlePhoneInput}
						inputmode="numeric"
						required
					/>
					<input type="hidden" name="phone" value={formState.phone} />
				</div>
			</div>

			<div class="flex gap-3 border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
				{#if formState.id}
					<Button
						type={isConfirmingDelete ? 'submit' : 'button'}
						variant={isConfirmingDelete ? 'destructive' : 'outline'}
						formaction="?/delete"
						onclick={(e) => {
							if (!isConfirmingDelete) {
								e.preventDefault();
								isConfirmingDelete = true;
							}
						}}
						class="h-12 flex-1 rounded-2xl"
					>
						{isConfirmingDelete ? 'Confirma?' : 'Excluir'}
					</Button>
				{/if}
				<Button
					type="submit"
					disabled={isLoading}
					class="h-12 flex-[2] rounded-2xl bg-zinc-900 text-white"
				>
					{isLoading ? '...' : 'Salvar'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(body) {
		background-color: white;
	}
</style>
