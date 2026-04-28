<script lang="ts">
	import { Plus, Search, Pencil, Trash2, LoaderCircle } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';

	import { customerSchema } from '$lib/schemas/app';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Estados para Modais
	let open = $state(false);
	let openDelete = $state(false);
	let isDeleting = $state(false);
	let customerToDelete = $state<{ id: string; name: string } | null>(null);
	let isLoading = $state(false);

	// Configuração do Superforms para o Upsert
	// svelte-ignore state_referenced_locally
	const {
		form,
		errors,
		enhance: formEnhance,
		delayed,
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
				if ($message) {
					toast.error($message);
				} else {
					toast.error('Erro de validação. Verifique os campos.');
				}
			}
		}
	});

	// Filtro de busca
	let searchQuery = $state('');
	let filteredCustomers = $derived(
		data.customers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
		)
	);

	function startEdit(customer: any) {
		// Preenche o store do superform com os dados do cliente
		$form = {
			id: customer.id,
			name: customer.name,
			phone: customer.phone
		};
		open = true;
	}

	function startCreate() {
		reset(); // Limpa o formulário para um novo cliente
		open = true;
	}

	function confirmDelete(customer: any) {
		customerToDelete = { id: customer.id, name: customer.name };
		openDelete = true;
	}
</script>

<div class="flex w-full max-w-xl flex-col gap-6 p-3 sm:p-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Clientes</h1>
			<p class="text-sm text-muted-foreground">Gerencie sua base de contatos.</p>
		</div>
		<Button onclick={startCreate} size="sm" class="h-9 cursor-pointer hover:shadow-sm sm:w-auto">
			<Plus class="mr-2 h-4 w-4" /> Novo Cliente
		</Button>
	</div>

	<Card.Root>
		<Card.Header class="pb-3">
			<div class="relative max-w-full">
				<Search class="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Buscar por nome ou telefone..."
					class="pl-9 hover:shadow-sm"
					bind:value={searchQuery}
				/>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="w-full overflow-x-auto rounded-md border">
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
										<Button variant="ghost" class="cursor-pointer hover:shadow-sm" size="icon" onclick={() => startEdit(customer)}>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive cursor-pointer hover:shadow-sm hover:bg-destructive/10"
											onclick={() => confirmDelete(customer)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="3" class="p-8 text-center text-muted-foreground italic">
									Nenhum cliente encontrado.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{$form.id ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
		</Dialog.Header>

		<form method="POST" action="?/upsert" class="grid gap-4 pt-4 pb-0" use:formEnhance>
			{#if $form.id}
				<input type="hidden" name="id" bind:value={$form.id} />
			{/if}

			<div class="grid gap-2">
				<Label for="name">Nome completo</Label>
				<Input
					id="name"
					name="name"
					bind:value={$form.name}
					maxlength={60}
					
					aria-invalid={$errors.name ? 'true' : undefined}
					oninput={(e) => {
            let val = e.currentTarget.value;
            
            val = val.replace(/\d/g, '');
            

            val = val.replace(/\s{2,}/g, ' ');

            $form.name = val;
        }}
		onblur={() => {

            $form.name = $form.name.trim();
        }}
				/>
				{#if $errors.name}
					<small class="text-destructive">{$errors.name}</small>
				{/if}
			</div>

			<div class="grid gap-2">
				<Label for="phone">Telefone (com DDD)</Label>
				<Input
					id="phone"
					name="phone"
					bind:value={$form.phone}
					inputmode="numeric"
					pattern="[0-9]+"
					minlength={11}
					maxlength={11}
					placeholder="11 99999-9999"
					aria-invalid={$errors.phone ? 'true' : undefined}
					oninput={(e) => {
        // Limpeza radical: só sobra o que for 0, 1, 2, 3, 4, 5, 6, 7, 8 ou 9
        $form.phone = e.currentTarget.value.replace(/\D/g, '');
    }}
				/>
				{#if $errors.phone}
					<small class="text-destructive">{$errors.phone}</small>
				{/if}
			</div>

			<Dialog.Footer>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						Salvando...
					{:else}
						Salvar Cliente
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={openDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir cliente?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta ação não pode ser desfeita. Remover <strong>{customerToDelete?.name}</strong>?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isDeleting} class="cursor-pointer">Cancelar</AlertDialog.Cancel>

			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							openDelete = false;
							toast.success('Cliente removido com sucesso!');
							await update();
							isDeleting = false;
						} else if (result.type === 'failure') {
							toast.error(result.data?.message || 'Erro ao excluir');
							isDeleting = false;
						}
					};
				}}
			>
				<input type="hidden" name="id" value={customerToDelete?.id} />

				<Button type="submit" variant="destructive" disabled={isDeleting} class="min-w-35 gap-2 cursor-pointer">
					{#if isDeleting}
						<LoaderCircle class="h-4 w-4 animate-spin" />
						Excluindo...
					{:else}
						Confirmar Exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
