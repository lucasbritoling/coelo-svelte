<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { Plus, Search, ChevronRight, Clock, Timer, ChevronLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';
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

	// ── Lógica de Interface ──────────────────────────────────────────

	function startCreate() {
		selectedService = null;
		openForm = true;
	}

	function startEdit(service: any) {
		selectedService = service;
		openForm = true;
	}

	// Sincroniza estado de modais para o botão voltar (Layout Hook)
	$effect(() => {
		ui.isModalOpen = openForm || openConfirmToggle || openDelete;
	});

	// ── Lógica de Status ──────────────────────────────────────────
	let servicePendingToggle = $state<any>(null);
	let openConfirmToggle = $state(false);

	async function handleToggle(service: any, newValue: boolean) {
		const activeServices = services.filter((s) => s.is_active);
		if (!newValue && activeServices.length === 1 && activeServices[0].id === service.id) {
			servicePendingToggle = service;
			openConfirmToggle = true;
			return;
		}
		await executeToggle(service.id, newValue);
	}

	async function executeToggle(id: string, is_active: boolean) {
		const idx = services.findIndex((s) => s.id === id);
		const previousValue = services[idx].is_active;
		services[idx].is_active = is_active;

		const formData = new FormData();
		formData.append('id', id);
		formData.append('is_active', String(is_active));

		try {
			const response = await fetch('?/updateStatus', { method: 'POST', body: formData });
			if (!response.ok) throw new Error();
			toast.success(is_active ? 'Serviço visível' : 'Serviço oculto');
		} catch (err) {
			services[idx].is_active = previousValue;
			toast.error('Erro ao atualizar status.');
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header Local (Estilo Agenda/Clientes) -->
	<header class="flex flex-col gap-4 px-6 pt-8 pb-4">
		<div>
			<div class="flex items-center gap-2">
				<button
					onclick={() => goto('/mais')}
					class="-ml-2 flex items-center p-2 text-zinc-400 transition-transform active:scale-90"
				>
					<ChevronLeft size={24} strokeWidth={2.5} />
				</button>
				<h1 class="text-3xl font-semibold tracking-tight text-zinc-700">Serviços</h1>
			</div>
			<p class="mt-1 text-sm text-zinc-500">Gerencie seus procedimentos e tempos.</p>
		</div>

		<div class="relative">
			<Search class="absolute top-3 left-3.5 size-4 text-zinc-400" />
			<Input
				type="search"
				placeholder="Procurar serviço..."
				class="h-11 rounded-2xl border-none bg-zinc-100 pl-10 focus-visible:ring-zinc-200"
				bind:value={searchQuery}
			/>
		</div>
	</header>

	<!-- Lista de Serviços -->
	<div class="flex-1 space-y-3 overflow-y-auto px-4 pb-32">
		{#each filteredServices as service (service.id)}
			<div
				class="group relative flex w-full flex-col overflow-hidden rounded-[24px] border border-zinc-100 bg-white p-4 transition-all active:scale-[0.98]"
			>
				<!-- Botão de Edição (Área clicável principal) -->
				<button onclick={() => startEdit(service)} class="flex items-center gap-4 text-left">
					<div
						class="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
					>
						<Timer size={20} />
					</div>

					<div class="min-w-0 flex-1">
						<p class="truncate font-bold text-zinc-900 {!service.is_active ? 'opacity-50' : ''}">
							{service.name}
						</p>

						<div class="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium">
							<span class="flex items-center gap-1 text-zinc-500">
								<Clock class="size-3" />
								{service.duration} min
							</span>

							{#if service.buffer_after_min > 0}
								<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
									+{service.buffer_after_min}m intervalo
								</span>
							{/if}
						</div>
					</div>

					<ChevronRight class="size-4 text-zinc-300" />
				</button>

				<!-- Controle de Visibilidade (Switch separado da ação de editar) -->
				<div class="mt-3 flex items-center justify-between border-t border-zinc-50 pt-3">
					<span class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
						{service.is_active ? 'Visível para clientes' : 'Oculto na agenda'}
					</span>
					{#key switchVersion}
						<Switch checked={service.is_active} onCheckedChange={(v) => handleToggle(service, v)} />
					{/key}
				</div>
			</div>
		{:else}
			<div class="py-20 text-center">
				<p class="text-sm text-zinc-400 italic">Nenhum serviço encontrado.</p>
			</div>
		{/each}
	</div>
</div>

<!-- FAB (Estilo consistente) -->
<!-- Wrapper para centralizar a FAB de Clientes -->
<div class="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style="bottom: 100px">
	<!-- Container que limita a largura ao layout do app (448px) -->
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

<!-- Modais (ServiceForm já deve usar o estilo do Dialog refatorado) -->
<ServiceForm formData={data.form} service={selectedService} bind:open={openForm} />

<!-- Alerta de Desativação Total -->
<AlertDialog.Root bind:open={openConfirmToggle}>
	<AlertDialog.Content class="rounded-[32px] p-6">
		<AlertDialog.Header>
			<AlertDialog.Title class="text-xl font-bold">Desativar sua agenda?</AlertDialog.Title>
			<AlertDialog.Description class="text-zinc-500">
				Este é seu único serviço ativo. Se desativá-lo, ninguém conseguirá agendar horários com você
				através do link.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex flex-col gap-2 pt-4">
			<Button
				variant="destructive"
				class="h-12 rounded-2xl"
				onclick={() => {
					executeToggle(servicePendingToggle.id, false);
					openConfirmToggle = false;
				}}
			>
				Ocultar Agenda
			</Button>
			<AlertDialog.Cancel
				class="h-12 rounded-2xl border-none bg-zinc-100"
				onclick={() => {
					openConfirmToggle = false;
					switchVersion++;
				}}>Manter Online</AlertDialog.Cancel
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	:global(body) {
		background-color: white;
	}
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
