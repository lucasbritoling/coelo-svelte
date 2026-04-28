<script lang="ts">
	import { Plus, Search, Pencil, Trash2, Clock, LoaderCircle } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import ServicesForm from './services-form.svelte';

	// Svelte 5: Recebendo as props (data vem do +page.server.ts)
	let { data } = $props();

	// Estados de Controle (Runes)
	let openForm = $state(false);
	let openDelete = $state(false);
	let isLoading = $state(false);

	// Estado para o serviço que será editado ou deletado
	let selectedService = $state<any>(null);
	let serviceToDelete = $state<{ id: string; name: string } | null>(null);

	// Filtro Reativo usando $derived
	let searchQuery = $state('');
	let filteredServices = $derived(
		data.services.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	// Funções de Ação
	function startCreate() {
		selectedService = null; // Garante que o form venha limpo
		openForm = true;
	}

	function startEdit(service: any) {
		selectedService = service; // Passa o objeto completo para o Form
		openForm = true;
	}

	function confirmDelete(service: any) {
		serviceToDelete = { id: service.id, name: service.name };
		openDelete = true;
	}

	function toggleActive(serviceId: string, newValue: boolean) {
		const checkbox = document.getElementById(`check-${serviceId}`) as HTMLInputElement;
		if (checkbox) {
			checkbox.checked = newValue;

			// Pequeno delay para garantir que o estado do Svelte 5 sincronizou
			setTimeout(() => {
				const form = document.getElementById(`form-status-${serviceId}`) as HTMLFormElement;
				form?.requestSubmit();
			}, 50);
		}
	}
</script>

<div class="flex max-w-2xl min-w-0! flex-col gap-6 p-3 sm:p-6">
	<div class="flex min-w-0! flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Serviços</h1>
			<p class="text-sm text-muted-foreground">
				Configure os procedimentos e tempos de atendimento.
			</p>
		</div>
		<Button
			onclick={startCreate}
			size="sm"
			class="h-9 w-full cursor-pointer hover:shadow-sm sm:w-auto"
		>
			<Plus class="mr-2 h-4 w-4" /> Novo Serviço
		</Button>
	</div>

	<Card.Root class="min-w-0!">
		<Card.Header class="pb-3">
			<div class="relative max-w-full min-w-0">
				<Search class="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Procurar serviço..."
					class="pl-9 hover:shadow-sm"
					bind:value={searchQuery}
				/>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="overflow-x-auto rounded-md border">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/50 text-left font-medium">
							<th class="p-3">Nome</th>
							<th class="w-[120px] p-3">Duração</th>
							<th class="w-[80px] p-3 text-center">Visível</th>
							<th class="w-[100px] p-3 text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredServices as service (service.id)}
							<tr
								class="border-b transition-colors hover:bg-muted/30"
								class:opacity-50={!service.is_active}
							>
								<td class="p-3 font-medium">{service.name}</td>
								<td class="p-3">
									<div class="flex items-center gap-2 text-muted-foreground">
										{service.duration} min
									</div>
								</td>

								<td class="p-3">
									<form
										id="form-status-{service.id}"
										method="POST"
										action="?/updateStatus"
										use:enhance={() => {
											return async ({ result }) => {
												if (result.type === 'failure') {
													toast.error('Erro ao atualizar status.');
													service.is_active = !service.is_active; // Reverte o switch
												}
											};
										}}
										class="flex justify-center"
									>
										<input type="hidden" name="id" value={service.id} />
										<input
											type="hidden"
											name="is_active"
											id="check-{service.id}"
											value={service.is_active}
										/>

										<Switch
											class="cursor-pointer"
											checked={service.is_active}
											onCheckedChange={(v) => {
												service.is_active = v; // Efeito visual imediato
												toggleActive(service.id, v); // Dispara o auto-save
											}}
										/>
									</form>
								</td>

								<td class="p-3 text-right">
									<div class="flex justify-end gap-1">
										<Button
											variant="ghost"
											size="icon"
											class="cursor-pointer hover:shadow-sm"
											onclick={() => startEdit(service)}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="cursor-pointer text-destructive hover:bg-destructive/10 hover:shadow-sm"
											onclick={() => confirmDelete(service)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="p-8 text-center text-muted-foreground italic">
									Nenhum serviço encontrado.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<ServicesForm formData={data.form} service={selectedService} bind:open={openForm} />

<AlertDialog.Root bind:open={openDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir serviço?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta ação não pode ser desfeita. Remover <strong>{serviceToDelete?.name}</strong>?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isLoading} class="cursor-pointer">Cancelar</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isLoading = true;
					return async ({ result, update }) => {
						await update();
						isLoading = false;
						if (result.type === 'success') {
							openDelete = false;
							toast.success('Removido com sucesso!');
						} else if (result.type === 'failure') {
							// @ts-ignore
							toast.error(result.data?.message ?? 'Erro ao excluir.');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={serviceToDelete?.id} />
				<Button
					type="submit"
					variant="destructive"
					disabled={isLoading}
					class="min-w-[140px] cursor-pointer"
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 size-4 animate-spin" />
						Removendo...
					{:else}
						Confirmar Exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
