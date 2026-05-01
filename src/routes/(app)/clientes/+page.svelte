<script lang="ts">
	import { Plus, Search, Trash2, LoaderCircle, ChevronRight, Phone, User } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { MediaQuery } from 'svelte/reactivity';
	import { customerSchema } from '$lib/schemas/app';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { enhance } from '$app/forms';

	let { data } = $props();

	const isDesktop = new MediaQuery('(min-width: 640px)');

	let open = $state(false);
	let openDelete = $state(false);
	let isDeleting = $state(false);
	let customerToDelete = $state<{ id: string; name: string } | null>(null);
	let isLoading = $state(false);

	// svelte-ignore state_referenced_locally
	const {
		form,
		errors,
		enhance: formEnhance,
		reset,
		message
	} = superForm(data.form, {
		validators: zod4Client(customerSchema),
		resetForm: true,
		onSubmit: () => {
			isLoading = true;
		},
		onResult: () => {
			isLoading = false;
		},
		onUpdated: ({ form }) => {
			if (form.valid) {
				open = false;
				toast.success('Cliente salvo com sucesso!');
			} else {
				toast.error($message || 'Erro de validação. Verifique os campos.');
			}
		}
	});

	let searchQuery = $state('');
	let filteredCustomers = $derived(
		data.customers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
		)
	);

	function startEdit(customer: any) {
		if (swipedId === customer.id) {
			swipedId = null;
			return;
		}
		$form = { id: customer.id, name: customer.name, phone: customer.phone };
		open = true;
	}

	function startCreate() {
		reset();
		open = true;
	}

	function confirmDelete(customer: any) {
		swipedId = null;
		customerToDelete = { id: customer.id, name: customer.name };
		openDelete = true;
	}

	// ── Swipe-to-delete ────────────────────────────────────────────
	let swipedId = $state<string | null>(null);
	let touching = $state(false);
	let touchStartX = 0;
	let touchStartY = 0;
	let lockAxis = $state<'h' | 'v' | null>(null);
	const SWIPE_OPEN_X = -80;
	const SWIPE_THRESHOLD = 52;

	function onTouchStart(e: TouchEvent, id: string) {
		if (swipedId && swipedId !== id) {
			swipedId = null;
			return;
		}
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		lockAxis = null;
		touching = true;
	}

	function onTouchMove(e: TouchEvent, id: string) {
		const dx = e.touches[0].clientX - touchStartX;
		const dy = e.touches[0].clientY - touchStartY;
		if (!lockAxis) lockAxis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
		if (lockAxis === 'h') e.preventDefault();
	}

	function onTouchEnd(e: TouchEvent, id: string) {
		touching = false;
		if (lockAxis !== 'h') return;
		const dx = e.changedTouches[0].clientX - touchStartX;
		if (dx < -SWIPE_THRESHOLD) swipedId = id;
		else if (dx > SWIPE_THRESHOLD / 2) swipedId = null;
		lockAxis = null;
	}

	function closeSwipe() {
		swipedId = null;
	}
</script>

{#if swipedId}
	<div
		class="fixed inset-0 z-10"
		role="presentation"
		onclick={closeSwipe}
		ontouchstart={closeSwipe}
	></div>
{/if}

<!-- ─────────────────────── MOBILE ──────────────────────────────── -->
<div class="flex w-full flex-col gap-4 p-4 pb-28 sm:hidden">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Clientes</h1>
		<p class="text-sm text-muted-foreground">Gerencie sua base de contatos.</p>
	</div>

	<div class="relative">
		<Search class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
		<Input
			type="search"
			placeholder="Buscar por nome ou telefone..."
			class="pl-9"
			bind:value={searchQuery}
		/>
	</div>

	{#if data.customers.length > 0}
		<p class="text-center text-[11px] text-muted-foreground/60 select-none">
			← Deslize para excluir · Toque para editar
		</p>
	{/if}

	<div class="overflow-hidden rounded-2xl border bg-background shadow-sm">
		{#each filteredCustomers as customer (customer.id)}
			<div class="relative overflow-hidden border-b last:border-b-0">
				<!-- Fundo: ação de deletar -->
				<div
					class="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-destructive"
				>
					<button
						class="flex h-full w-full flex-col items-center justify-center gap-1 text-white active:opacity-70"
						onclick={() => confirmDelete(customer)}
					>
						<Trash2 class="size-5" />
						<span class="text-[10px] font-semibold tracking-wide">Excluir</span>
					</button>
				</div>

				<!-- Conteúdo deslizável -->
				<div
					class="relative z-10 flex items-center gap-3 bg-background px-4 py-3.5 will-change-transform"
					class:transition-transform={!touching}
					style="transform: translateX({swipedId === customer.id ? SWIPE_OPEN_X : 0}px)"
					ontouchstart={(e) => onTouchStart(e, customer.id)}
					ontouchmove={(e) => onTouchMove(e, customer.id)}
					ontouchend={(e) => onTouchEnd(e, customer.id)}
					role="button"
					tabindex="0"
					onclick={() => startEdit(customer)}
					onkeydown={(e) => e.key === 'Enter' && startEdit(customer)}
				>
					<!-- Avatar inicial -->
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
					>
						{customer.name.charAt(0).toUpperCase()}
					</div>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<p class="truncate leading-snug font-semibold">{customer.name}</p>
						<p class="mt-0.5 font-mono text-xs text-muted-foreground">{customer.phone}</p>
					</div>

					<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
				</div>
			</div>
		{:else}
			<div class="py-16 text-center">
				<p class="text-sm italic text-muted-foreground">Nenhum cliente encontrado.</p>
			</div>
		{/each}
	</div>
</div>

<!-- FAB -->
<button
	onclick={startCreate}
	class="fixed right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5
		text-sm font-semibold text-primary-foreground shadow-[0_4px_20px_rgba(0,0,0,0.25)]
		transition-all duration-150 active:scale-95 active:shadow-sm sm:hidden"
	style="bottom: calc(4rem + 1rem + env(safe-area-inset-bottom))"
	aria-label="Novo Cliente"
>
	<Plus class="size-5" />
	Novo Cliente
</button>

<!-- ─────────────────────── DESKTOP ─────────────────────────────── -->
<div class="hidden w-full max-w-xl flex-col gap-6 p-6 sm:flex">
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
		<Search class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
		<Input
			type="search"
			placeholder="Buscar por nome ou telefone..."
			class="pl-9"
			bind:value={searchQuery}
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
						<td class="p-3 font-mono text-muted-foreground">{customer.phone}</td>
						<td class="p-3 text-right">
							<div class="flex justify-end gap-1">
								<Button
									variant="ghost"
									size="icon"
									class="cursor-pointer"
									onclick={() => startEdit(customer)}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg
									>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="cursor-pointer text-destructive hover:bg-destructive/10"
									onclick={() => confirmDelete(customer)}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="3" class="p-8 text-center italic text-muted-foreground"
							>Nenhum cliente encontrado.</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- ────────────────── Form: Drawer (mobile) / Dialog (desktop) ── -->

{#snippet formFields()}
	<input type="hidden" name="id" bind:value={$form.id} />

	<div class="grid gap-2">
		<Label for="name" class={$errors.name ? 'text-destructive' : ''}>Nome completo</Label>
		<div class="relative">
			<User class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
			<Input
				id="name"
				name="name"
				class="pl-9"
				bind:value={$form.name}
				maxlength={60}
				aria-invalid={$errors.name ? 'true' : undefined}
				oninput={(e) => {
					$form.name = e.currentTarget.value.replace(/\d/g, '').replace(/\s{2,}/g, ' ');
				}}
				onblur={() => {
					$form.name = $form.name.trim();
				}}
			/>
		</div>
		{#if $errors.name}
			<small class="text-destructive">{$errors.name}</small>
		{/if}
	</div>

	<div class="grid gap-2">
		<Label for="phone" class={$errors.phone ? 'text-destructive' : ''}>Telefone (com DDD)</Label>
		<div class="relative">
			<Phone class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
			<Input
				id="phone"
				name="phone"
				class="pl-9 font-mono"
				bind:value={$form.phone}
				inputmode="numeric"
				minlength={11}
				maxlength={11}
				placeholder="11 99999-9999"
				aria-invalid={$errors.phone ? 'true' : undefined}
				oninput={(e) => {
					$form.phone = e.currentTarget.value.replace(/\D/g, '');
				}}
			/>
		</div>
		{#if $errors.phone}
			<small class="text-destructive">{$errors.phone}</small>
		{/if}
	</div>
{/snippet}

{#snippet submitButton()}
	<Button type="submit" disabled={isLoading} class="w-full cursor-pointer">
		{#if isLoading}
			<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Salvando...
		{:else}
			{$form.id ? 'Salvar Alterações' : 'Criar Cliente'}
		{/if}
	</Button>
{/snippet}

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Content class="flex max-h-[95dvh] flex-col gap-0 p-0 sm:max-w-[400px]">
			<Dialog.Header class="border-b px-6 py-4">
				<Dialog.Title>{$form.id ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
			</Dialog.Header>
			<form
				method="POST"
				action="?/upsert"
				class="flex flex-1 flex-col overflow-y-auto"
				use:formEnhance
			>
				<div class="flex flex-col gap-4 px-6 py-5">
					{@render formFields()}
				</div>
				<div class="border-t px-6 py-4">
					{@render submitButton()}
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content>
			<Drawer.Header class="border-b text-left">
				<Drawer.Title>{$form.id ? 'Editar Cliente' : 'Novo Cliente'}</Drawer.Title>
			</Drawer.Header>
			<form method="POST" action="?/upsert" class="flex flex-col overflow-y-auto" use:formEnhance>
				<div class="flex flex-col gap-4 px-4 py-5">
					{@render formFields()}
				</div>
				<Drawer.Footer class="border-t">
					<Drawer.Close>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-full">Cancelar</Button>
						{/snippet}
					</Drawer.Close>
				</Drawer.Footer>
			</form>
		</Drawer.Content>
	</Drawer.Root>
{/if}

<!-- ──────────────────────── Delete ──────────────────────────────── -->
<AlertDialog.Root bind:open={openDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir cliente?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta ação não pode ser desfeita. Remover <strong>{customerToDelete?.name}</strong>?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex-col-reverse gap-2 sm:flex-row">
			<AlertDialog.Cancel disabled={isDeleting} class="w-full cursor-pointer sm:w-auto">
				Cancelar
			</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				class="w-full sm:w-auto"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							openDelete = false;
							toast.success('Cliente removido com sucesso!');
							await update();
						} else if (result.type === 'failure') {
							toast.error(result.data?.message || 'Erro ao excluir');
						}
						isDeleting = false;
					};
				}}
			>
				<input type="hidden" name="id" value={customerToDelete?.id} />
				<Button
					type="submit"
					variant="destructive"
					disabled={isDeleting}
					class="w-full cursor-pointer sm:min-w-36"
				>
					{#if isDeleting}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Excluindo...
					{:else}
						Confirmar Exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
