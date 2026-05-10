<script lang="ts">
	import {
		Plus,
		Search,
		Trash2,
		Pencil,
		LoaderCircle,
		ChevronRight,
		Phone,
		User
	} from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	// Estados de controle
	let open = $state(false);
	let openDelete = $state(false);
	let isLoading = $state(false);
	let isConfirmingDelete = $state(false);
	let isSearching = $state(false);

	// Estado manual do formulário
	let formState = $state({
		id: '',
		name: '',
		phone: ''
	});

	let customerToDelete = $state<{ id: string; name: string } | null>(null);

	let filteredCustomers = $derived(
		data.customers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
		)
	);

	// Reset de estados ao abrir/fechar
	$effect(() => {
		if (!open) {
			isConfirmingDelete = false;
		}
	});

	function startCreate() {
		formState = { id: '', name: '', phone: '' };
		open = true;
	}

	function startEdit(customer: any) {
		formState = { id: customer.id, name: customer.name, phone: customer.phone };
		open = true;
	}

	function startDeleteDesktop(customer: any) {
		customerToDelete = { id: customer.id, name: customer.name };
		openDelete = true;
	}
	let searchQuery = $state(data.q || '');

	// Debounce para não martelar o banco a cada tecla
	let searchTimeout: ReturnType<typeof setTimeout>;

	function handleSearch(e: Event) {
		isSearching = true;
		const value = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimeout);

		searchTimeout = setTimeout(() => {
			const newUrl = new URL(page.url);
			if (value) {
				newUrl.searchParams.set('q', value);
			} else {
				newUrl.searchParams.delete('q');
			}

			goto(newUrl.search, {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			}).finally(() => {
				isSearching = false;
			});
		}, 300); // 300ms de espera após o usuário parar de digitar
	}
	function handlePhoneInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		// Pega apenas os números
		let value = input.value.replace(/\D/g, '');

		// Limita a 11 dígitos
		if (value.length > 11) value = value.slice(0, 11);

		// Aplica a máscara (XX) XXXXX-XXXX
		let formatted = value;
		if (value.length > 2) {
			formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
		}
		if (value.length > 7) {
			formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
		}

		// Atualiza o estado com os números puros (para o banco)
		formState.phone = value;
		// Atualiza o valor visual do input
		input.value = formatted;
	}
	function handleNameInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		let value = input.value.replace(/\d/g, ''); // Remove números

		// Capitaliza a primeira letra de cada palavra
		formState.name = value.replace(/\b\w/g, (l) => l.toUpperCase());
	}
	function formatPhone(v: string) {
		if (!v) return '';
		let value = v.replace(/\D/g, '');
		if (value.length > 11) value = value.slice(0, 11);

		let formatted = value;
		if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
		if (value.length > 7)
			formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

		return formatted;
	}
</script>

{#snippet emptyState()}
	<div class="py-16 text-center">
		{#if isSearching}
			<div class="flex flex-col items-center gap-2">
				<LoaderCircle class="h-5 w-5 animate-spin text-primary" />
				<p class="text-sm text-muted-foreground">Buscando clientes...</p>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground italic">Nenhum cliente encontrado.</p>
		{/if}
	</div>
{/snippet}

<!-- ───────────────────────── MOBILE ───────────────────────────── -->
<div class="flex w-full flex-col gap-4 p-4 pb-28 sm:hidden">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Clientes</h1>
		<p class="text-sm text-muted-foreground">Gerencie sua base de contatos.</p>
	</div>

	<div class="relative">
		<Search
			class="absolute top-2.5 left-3 h-4 w-4 {isSearching
				? 'animate-pulse text-primary'
				: 'text-muted-foreground'}"
		/>
		<Input
			type="search"
			placeholder="Buscar por nome ou telefone..."
			class="pl-9"
			bind:value={searchQuery}
			oninput={handleSearch}
		/>
	</div>

	{#if data.customers.length > 0}
		<p class="text-center select-none">Toque para editar</p>
	{/if}

	<div class="overflow-hidden rounded-2xl border bg-background shadow-sm">
		{#each filteredCustomers as customer (customer.id)}
			<div class="relative border-b last:border-b-0">
				<div
					class="flex items-center gap-3 bg-background px-4 py-3.5 transition-colors active:bg-muted/50"
					role="button"
					tabindex="0"
					onclick={() => startEdit(customer)}
					onkeydown={(e) => e.key === 'Enter' && startEdit(customer)}
				>
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
					>
						{customer.name.charAt(0).toUpperCase()}
					</div>

					<div class="min-w-0 flex-1">
						<p class="truncate leading-snug font-semibold">{customer.name}</p>
						<p class="mt-0.5 font-mono text-xs text-muted-foreground">
							{formatPhone(customer.phone)}
						</p>
					</div>

					<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
				</div>
			</div>
		{:else}
			<div class="py-16 text-center">
				{#if isSearching}
					<div class="flex flex-col items-center gap-2">
						<LoaderCircle class="h-5 w-5 animate-spin text-primary" />
						<p class="text-sm text-muted-foreground">Buscando clientes...</p>
					</div>
				{:else}
					{@render emptyState()}
				{/if}
			</div>
		{/each}
	</div>
	{#if data.customers.length >= 100}
		<p class="mt-2 text-center text-[10px] tracking-widest text-muted-foreground/60 uppercase">
			Mostrando os 100 primeiros. Use a busca para filtrar.
		</p>
	{/if}
</div>

<!-- FAB -->
<button
	onclick={startCreate}
	class="fixed right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5
        text-sm font-semibold text-primary-foreground shadow-[0_4px_20px_rgba(0,0,0,0.25)]
        transition-all duration-150 active:scale-95 active:shadow-sm sm:hidden"
	style="bottom: calc(4rem + 1rem + env(safe-area-inset-bottom))"
>
	<Plus class="size-5" />
	Novo Cliente
</button>

<!-- ─────────────────────── DESKTOP ────────────────────────────── -->
<div class="max-lg mx-auto hidden w-full flex-col gap-6 p-6 sm:flex sm:max-w-lg">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Clientes</h1>
			<p class="text-sm text-muted-foreground">Gerencie sua base de contatos.</p>
		</div>
		<Button onclick={startCreate} size="sm" class="h-9 shrink-0 cursor-pointer">
			<Plus class="mr-2 h-4 w-4" /> Novo Cliente
		</Button>
	</div>

	<div class="relative">
		<!-- Adicione a lógica do ícone aqui também -->
		<Search
			class="absolute top-2.5 left-3 h-4 w-4 {isSearching
				? 'animate-pulse text-primary'
				: 'text-muted-foreground'}"
		/>
		<Input
			type="search"
			placeholder="Buscar por nome ou telefone..."
			class="pl-9"
			bind:value={searchQuery}
			oninput={handleSearch}
		/>
	</div>

	<div class="overflow-x-auto rounded-md border">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b bg-muted/50 text-left font-medium">
					<th class="p-3">Nome</th>
					<th class="p-3">WhatsApp</th>
					<th class="p-3 text-right">Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredCustomers as customer (customer.id)}
					<tr class="border-b transition-colors hover:bg-muted/30">
						<td class="p-3 font-medium">{customer.name}</td>
						<td class="p-3 font-mono text-muted-foreground">{formatPhone(customer.phone)}</td>
						<td class="p-3 text-right">
							<div class="flex justify-end gap-1">
								<Button
									variant="ghost"
									size="icon"
									class="cursor-pointer"
									onclick={() => startEdit(customer)}
								>
									<Pencil class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="cursor-pointer text-destructive hover:bg-destructive/10"
									onclick={() => startDeleteDesktop(customer)}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="3">
							{@render emptyState()}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if data.customers.length >= 100}
		<p class="mt-2 text-center text-[10px] tracking-widest text-muted-foreground/60 uppercase">
			Mostrando os 100 primeiros. Use a busca para filtrar.
		</p>
	{/if}
</div>

<!-- ────────────────── Dialog Adaptativo ──────────────────────── -->
<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90dvh] w-[95vw] flex-col gap-0 
           overflow-hidden rounded-xl p-0 sm:max-w-[400px]"
	>
		<Dialog.Header class="shrink-0 border-b px-6 py-4">
			<Dialog.Title>{formState.id ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
		</Dialog.Header>

		<form
			method="POST"
			action="?/upsert"
			class="flex flex-1 flex-col overflow-hidden"
			use:enhance={({ cancel, submitter }) => {
				if (isConfirmingDelete && submitter?.getAttribute('formaction') !== '?/delete') {
					cancel();
					isConfirmingDelete = false;
					return;
				}
				isLoading = true;
				return async ({ result, update }) => {
					await update();
					isLoading = false;
					if (result.type === 'success') {
						open = false;
					}
				};
			}}
		>
			<div class="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
				<input type="hidden" name="id" value={formState.id} />

				<div class="grid gap-2">
					<Label for="name">Nome completo</Label>
					<div class="relative">
						<User class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							id="name"
							name="name"
							class="pl-9"
							bind:value={formState.name}
							minlength={3}
							required
							oninput={handleNameInput}
							onblur={() => (formState.name = formState.name.trim())}
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="phone">Telefone (com DDD)</Label>
					<div class="relative">
						<Phone class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							id="phone"
							class="pl-9 font-mono"
							value={formatPhone(formState.phone)}
							oninput={handlePhoneInput}
							inputmode="numeric"
							required
							placeholder="(11) 99999-9999"
							/* name="phone" REMOVIDO DAQUI */
						/>
						<input type="hidden" name="phone" value={formState.phone} />
					</div>
				</div>
			</div>

			<div class="shrink-0 border-t px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
				<div class="flex gap-3">
					{#if formState.id}
						{#if !isConfirmingDelete}
							<Button
								type="button"
								variant="outline"
								onclick={() => (isConfirmingDelete = true)}
								class="flex-1 cursor-pointer border-destructive/20 text-destructive sm:hidden"
							>
								<Trash2 class="mr-2 h-4 w-4" /> Excluir
							</Button>
						{:else}
							<Button
								type="submit"
								variant="destructive"
								formaction="?/delete"
								disabled={isLoading}
								class="flex-1 animate-in cursor-pointer duration-200 zoom-in-95 fade-in sm:hidden"
							>
								{#if isLoading}
									<LoaderCircle class="h-4 w-4 animate-spin" />
								{:else}
									Confirmar?
								{/if}
							</Button>
						{/if}
					{/if}

					<Button
						type="submit"
						disabled={isLoading}
						class="cursor-pointer {formState.id ? 'flex-[2] sm:w-full' : 'w-full'}"
					>
						{#if isLoading}
							<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Salvando...
						{:else}
							{isConfirmingDelete ? 'Cancelar' : formState.id ? 'Salvar' : 'Criar Cliente'}
						{/if}
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- ──────────────────────── Delete Desktop ──────────────────────── -->
<AlertDialog.Root bind:open={openDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir cliente?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta ação não pode ser desfeita. Remover <strong>{customerToDelete?.name}</strong>?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex-col-reverse gap-2 sm:flex-row">
			<AlertDialog.Cancel disabled={isLoading} class="w-full cursor-pointer sm:w-auto">
				Cancelar
			</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				class="w-full sm:w-auto"
				use:enhance={() => {
					isLoading = true;
					return async ({ result, update }) => {
						await update();
						isLoading = false;
						if (result.type === 'success') {
							openDelete = false;
						}
					};
				}}
			>
				<input type="hidden" name="id" value={customerToDelete?.id} />
				<Button
					type="submit"
					variant="destructive"
					disabled={isLoading}
					class="w-full cursor-pointer sm:min-w-36"
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Excluindo...
					{:else}
						Confirmar Exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
