<script lang="ts">
	import { Plus, Search, Pencil, Trash2, Clock, Settings2, LoaderCircle } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Estados de Controle
	let open = $state(false);
	let openDelete = $state(false);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);

	// Dados Reativos
	let editingService = $state<{ id?: string; name: string; duration: number | string } | null>(
		null
	);
	let serviceToDelete = $state<{ id: string; name: string } | null>(null);

	let searchQuery = $state('');
	let filteredServices = $derived(
		data.services.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function startEdit(service: any) {
		editingService = { ...service };
		open = true;
	}

	function startCreate() {
		editingService = { name: '', duration: 30 }; // 30min padrão
		open = true;
	}

	function confirmDelete(service: any) {
		serviceToDelete = { id: service.id, name: service.name };
		openDelete = true;
	}
</script>

<div class="mx-auto flex max-w-7xl flex-col gap-6 p-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Serviços</h1>
			<p class="text-sm text-muted-foreground">
				Configure os procedimentos e tempos de atendimento.
			</p>
		</div>
		<Button onclick={startCreate} size="sm" class="h-9">
			<Plus class="mr-2 h-4 w-4" /> Novo Serviço
		</Button>
	</div>

	<Card.Root>
		<Card.Header class="pb-3">
			<div class="relative max-w-sm">
				<Search class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Procurar serviço..."
					class="pl-9"
					bind:value={searchQuery}
				/>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="rounded-md border">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/50 text-left font-medium">
							<th class="p-3">Nome do Serviço</th>
							<th class="p-3">Duração</th>
							<th class="p-3 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredServices as service (service.id)}
							<tr class="border-b transition-colors hover:bg-muted/30">
								<td class="p-3 font-medium">{service.name}</td>
								<td class="p-3">
									<div class="flex items-center gap-2 text-muted-foreground">
										<Clock class="h-3.5 w-3.5" />
										{service.duration} min
									</div>
								</td>
								<td class="p-3 text-right">
									<div class="flex justify-end gap-2">
										<Button variant="ghost" size="icon" onclick={() => startEdit(service)}>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive hover:bg-destructive/10"
											onclick={() => confirmDelete(service)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="3" class="p-8 text-center text-muted-foreground italic"
									>Nenhum serviço registrado.</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[400px]">
		<Dialog.Header>
			<Dialog.Title>{editingService?.id ? 'Editar Serviço' : 'Novo Serviço'}</Dialog.Title>
		</Dialog.Header>
		<form
			method="POST"
			action="?/upsert"
			class="grid gap-4 py-4"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					await update();
					isSubmitting = false;
					if (result.type === 'success') {
						open = false;
						toast.success('Serviço guardado!');
					}
				};
			}}
		>
			{#if editingService?.id}
				<input type="hidden" name="id" value={editingService.id} />
			{/if}

			<div class="grid gap-2">
				<Label for="name">Nome do serviço</Label>
				<Input
					id="name"
					name="name"
					bind:value={editingService!.name}
					placeholder="Ex: Corte de Cabelo"
					required
				/>
			</div>

			<div class="grid gap-2">
				<Label for="duration">Duração (minutos)</Label>
				<div class="relative">
					<Clock class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						id="duration"
						name="duration"
						type="number"
						class="pl-9"
						bind:value={editingService!.duration}
						min="1"
						required
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button type="submit" disabled={isSubmitting} class="w-full">
					{#if isSubmitting}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Guardar Alterações
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={openDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir serviço?</AlertDialog.Title>
			<AlertDialog.Description>
				Tem a certeza que deseja remover <strong>{serviceToDelete?.name}</strong>?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isDeleting}>Cancelar</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result, update }) => {
						// O update() garante que a página sincronize, mas
						// precisamos verificar o tipo de resultado ANTES de fechar o modal.
						await update();
						isDeleting = false;

						if (result.type === 'success') {
							openDelete = false;
							toast.success('Removido com sucesso!');
						} else if (result.type === 'failure') {
							// Aqui pegamos a mensagem amigável que você definiu no fail(400, { message: ... })
							toast.error(result.data?.message ?? 'Erro ao excluir registro.');
						} else {
							toast.error('Ocorreu um erro inesperado.');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={serviceToDelete?.id} />
				<Button type="submit" variant="destructive" disabled={isDeleting} class="gap-2">
					{#if isDeleting}
						<LoaderCircle class="size-4 animate-spin" />
						Processando...
					{:else}
						Confirmar Exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
