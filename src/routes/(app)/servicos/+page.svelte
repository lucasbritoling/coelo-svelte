<script lang="ts">
	import {
		Plus,
		Search,
		Trash2,
		LoaderCircle,
		ChevronRight,
		Pencil,
		Clock,
		ShieldAlert
	} from '@lucide/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import ServiceForm from '$lib/components/app/service-form.svelte';

	let { data } = $props();

	// Sincroniza estado com os dados do servidor
	let services = $state<any[]>(data.services);
	$effect(() => {
		services = data.services;
	});

	let openForm = $state(false);
	let openDelete = $state(false);
	let isLoading = $state(false);
	let selectedService = $state<any>(null);
	let serviceToDelete = $state<{ id: string; name: string } | null>(null);
	let searchQuery = $state('');
	let switchVersion = $state(0);

	let filteredServices = $derived(
		services.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	// ── Lógica de Negócio ──────────────────────────────────────────

	function startCreate() {
		selectedService = null;
		openForm = true;
	}

	function startEdit(service: any) {
		selectedService = service;
		openForm = true;
	}

	function confirmDelete(service: any) {
		serviceToDelete = { id: service.id, name: service.name };
		openDelete = true;
	}

	// Toggle de Status Refatorado (Sem manipulação de DOM)
	let servicePendingToggle = $state<any>(null);
	let openConfirmToggle = $state(false);

	async function handleToggle(service: any, newValue: boolean) {
		// Validação: Não permitir que o profissional fique sem nenhum serviço ativo
		const activeServices = services.filter((s) => s.is_active);
		if (!newValue && activeServices.length === 1 && activeServices[0].id === service.id) {
			servicePendingToggle = service;
			openConfirmToggle = true;
			return;
		}

		await executeToggle(service.id, newValue);
	}

	async function executeToggle(id: string, is_active: boolean) {
		// Atualização Otimista (UI muda na hora)
		const idx = services.findIndex((s) => s.id === id);
		const previousValue = services[idx].is_active;
		services[idx].is_active = is_active;

		const formData = new FormData();
		formData.append('id', id);
		formData.append('is_active', String(is_active));

		try {
			const response = await fetch('?/updateStatus', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) throw new Error();
			toast.success(is_active ? 'Serviço visível' : 'Serviço oculto');
		} catch (err) {
			// Reverte em caso de erro no servidor
			services[idx].is_active = previousValue;
			toast.error('Não foi possível atualizar o status.');
		}
	}
</script>

{#snippet serviceDetails(service)}
	<div class="min-w-0 flex-1">
		<p class="truncate leading-snug font-semibold">{service.name}</p>
		<div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
			<span class="flex items-center gap-1"><Clock class="size-3" /> {service.duration} min</span>
			{#if service.buffer_after_min > 0}
				<span
					class="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
				>
					+{service.buffer_after_min}m intervalo
				</span>
			{/if}
			{#if service.min_notice_hours}
				<span class="rounded-full bg-muted px-2 py-0.5">
					{service.min_notice_hours}h antecedência
				</span>
			{/if}
		</div>
	</div>
{/snippet}

<div class="flex w-full flex-col gap-4 p-4 pb-28 sm:hidden">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Serviços</h1>
		<p class="text-sm text-muted-foreground">Regras e tempos de atendimento.</p>
	</div>

	<div class="relative">
		<Search class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
		<Input type="search" placeholder="Procurar serviço..." class="pl-9" bind:value={searchQuery} />
	</div>

	<div class="overflow-hidden rounded-2xl border bg-background shadow-sm">
		{#each filteredServices as service (service.id)}
			<div class="relative border-b last:border-b-0">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted/50"
					class:opacity-40={!service.is_active}
					role="button"
					tabindex="0"
					onclick={() => startEdit(service)}
				>
					{@render serviceDetails(service)}

					<div onclick={(e) => e.stopPropagation()} role="presentation">
						{#key switchVersion}
							<Switch
								checked={service.is_active}
								onCheckedChange={(v) => handleToggle(service, v)}
							/>
						{/key}
					</div>
					<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
				</div>
			</div>
		{:else}
			<div class="py-16 text-center italic text-muted-foreground text-sm">
				Nenhum serviço encontrado.
			</div>
		{/each}
	</div>
</div>

<div class="mx-auto hidden w-full max-w-lg flex-col gap-6 p-6 sm:flex">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Serviços</h1>
			<p class="text-sm text-muted-foreground">Regras e tempos de atendimento.</p>
		</div>
		<Button onclick={startCreate} size="sm" class="h-9 cursor-pointer">
			<Plus class="mr-2 h-4 w-4" /> Novo Serviço
		</Button>
	</div>

	<div class="relative">
		<Search class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
		<Input type="search" placeholder="Procurar..." class="pl-9" bind:value={searchQuery} />
	</div>

	<div class="overflow-hidden rounded-md border">
		<table class="w-full text-sm">
			<thead class="bg-muted/50 font-medium">
				<tr class="border-b">
					<th class="p-3 text-left">Serviço</th>
					<th class="p-3 text-center">Visível</th>
					<th class="p-3 text-right">Ações</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredServices as service (service.id)}
					<tr
						class="border-b transition-colors hover:bg-muted/30"
						class:opacity-50={!service.is_active}
					>
						<td class="p-3">
							<div class="font-medium">{service.name}</div>
							<div class="text-[11px] text-muted-foreground">
								{service.duration}min + {service.buffer_after_min}m
							</div>
						</td>
						<td class="p-3 text-center">
							<div class="flex justify-center">
								{#key switchVersion}
									<Switch
										checked={service.is_active}
										onCheckedChange={(v) => handleToggle(service, v)}
									/>
								{/key}
							</div>
						</td>
						<td class="p-3 text-right">
							<div class="flex justify-end gap-1">
								<Button variant="ghost" size="icon" onclick={() => startEdit(service)}
									><Pencil class="h-4 w-4" /></Button
								>
								<Button
									variant="ghost"
									size="icon"
									class="text-destructive hover:bg-destructive/10"
									onclick={() => confirmDelete(service)}><Trash2 class="h-4 w-4" /></Button
								>
							</div>
						</td>
					</tr>
				{:else}
					<tr
						><td colspan="3" class="p-8 text-center italic text-muted-foreground"
							>Nenhum serviço.</td
						></tr
					>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<button
	onclick={startCreate}
	class="fixed right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg active:scale-95 sm:hidden"
	style="bottom: calc(4rem + 1rem + env(safe-area-inset-bottom))"
>
	<Plus class="size-5" /> Novo Serviço
</button>

<ServiceForm formData={data.form} service={selectedService} bind:open={openForm} />

<AlertDialog.Root bind:open={openConfirmToggle}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Desativar sua agenda?</AlertDialog.Title>
			<AlertDialog.Description>
				Este é seu único serviço ativo. Se desativá-lo, ninguém conseguirá agendar horários com
				você.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel
				onclick={() => {
					openConfirmToggle = false;
					switchVersion++; // Aqui forçamos a reconstrução dos Switches
				}}>Manter Online</AlertDialog.Cancel
			>
			<Button
				variant="destructive"
				onclick={() => {
					executeToggle(servicePendingToggle.id, false);
					openConfirmToggle = false;
				}}
			>
				Ocultar Agenda
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={openDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir serviço?</AlertDialog.Title>
			<AlertDialog.Description
				>Remover <strong>{serviceToDelete?.name}</strong> permanentemente?</AlertDialog.Description
			>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isLoading}>Cancelar</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isLoading = true;
					return async ({ result, update }) => {
						await update();
						isLoading = false;
						if (result.type === 'success') openDelete = false;
					};
				}}
			>
				<input type="hidden" name="id" value={serviceToDelete?.id} />
				<Button type="submit" variant="destructive" disabled={isLoading} class="w-full sm:min-w-36">
					{isLoading ? 'Removendo...' : 'Confirmar Exclusão'}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
