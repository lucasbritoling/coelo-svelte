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

	// Novo estado para guardar o resultado do banco via API
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

	// Reatividade inteligente: se tem busca, usa o resultado da API. Se não, usa o load inicial.
	let currentCustomers = $derived(searchQuery.trim() !== '' ? apiCustomers : data.customers);

	// Filtro local opcional (apenas para o telefone, já que o nome foi filtrado no banco)
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

		// Se o usuário limpar o campo, cancela o loading e limpa a lista da API imediatamente
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
		}, 300); // Mantém o debounce de 300ms para poupar o banco
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
</script>

<div class="flex h-full flex-col">
	<!-- Header Local Simples (Estilo Agenda) -->
	<header class="flex flex-col gap-4 px-6 pt-8 pb-4">
		<div>
			<h1 class="text-3xl font-semibold text-zinc-700">Clientes</h1>
			<p class="text-sm text-zinc-500">Sua base de contatos</p>
		</div>

		<div class="relative">
			{#if isSearching}
				<LoaderCircle class="absolute top-3 left-3.5 size-4 animate-spin text-zinc-500" />
			{:else}
				<Search class="absolute top-3 left-3.5 size-4 text-zinc-400" />
			{/if}

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
					{getInitials(customer.name)}
				</div>
				<div class="min-w-0 flex-1 text-left">
					<p class="truncate font-bold text-zinc-900">{customer.name}</p>
					<p class=" text-xs text-zinc-400">{formatPhone(customer.phone)}</p>
				</div>
				<ChevronRight class="size-4 text-zinc-300" />
			</button>
		{:else}
			<div class="py-20 text-center px-4">
				{#if isSearching}
					<!-- Enquanto estiver buscando na API, mostramos um feedback neutro ou deixamos em branco -->
					<p class="text-sm text-zinc-400 italic animate-pulse">Buscando...</p>
				{:else if searchQuery.trim()}
					<!-- ESSE SÓ APARECE AO FINAL: Busca concluída e array vazio -->
					<p class="text-sm text-zinc-400 italic">
						Nenhum cliente encontrado para <span class="font-semibold text-zinc-600 not-italic"
							>"{searchQuery}"</span
						>.
					</p>
				{:else}
					<p class="text-sm text-zinc-400 italic">Nenhum cliente cadastrado.</p>
				{/if}
			</div>
		{/each}

		<!-- Indicadores de paginação/fim de lista (Só aparecem se NÃO estiver buscando) -->
		{#if !isSearching}
			{#if searchQuery.trim() !== '' && filteredCustomers.length >= 50}
				<p class="py-6 text-center text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
					Mostrando os primeiros 100 resultados.
				</p>
			{/if}
		{/if}
	</div>
</div>

<!-- FAB Discreto (Igual ao da Agenda) -->
<!-- Wrapper para centralizar a FAB de Clientes -->
<div class="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style="bottom: 100px">
	<!-- O max-w-md deve ser o mesmo do seu container principal -->
	<div class="relative flex w-full max-w-md justify-end px-6">
		<button
			onclick={startCreate}
			class="pointer-events-auto flex size-14 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-xl transition-all active:scale-90"
			aria-label="Novo cliente"
		>
			<Plus size={28} />
		</button>
	</div>
</div>

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
					// O update() aplica o resultado da action (limpa campos se necessário, etc)
					await update();
					isLoading = false;

					if (result.type === 'success') {
						toast.success(formState.id ? 'Atualizado com sucesso' : 'Criado com sucesso');
						open = false;
					}

					if (result.type === 'failure') {
						// Aqui capturamos a mensagem enviada pelo fail(400, { message: '...' })
						const message = result.data?.message || 'Ocorreu um erro inesperado';
						toast.error(message);

						// Resetamos o estado de confirmação para o botão voltar ao normal após o erro
						isConfirmingDelete = false;
					}

					if (result.type === 'error') {
						toast.error('Erro de conexão ou erro interno do servidor');
					}
				};
			}}
		>
			<div class="space-y-6 px-6 pb-8">
				<input type="hidden" name="id" value={formState.id} />
				<div class="grid gap-2">
					<Label class="text-xs font-bold tracking-widest text-zinc-400 uppercase">Nome</Label>
					<Input name="name" bind:value={formState.name} required class="h-12 rounded-2xl" />
				</div>
				<div class="grid gap-2">
					<Label class="text-xs font-bold tracking-widest text-zinc-400 uppercase">WhatsApp</Label>
					<Input
						class="h-12 rounded-2xl "
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
						variant="destructive"
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
