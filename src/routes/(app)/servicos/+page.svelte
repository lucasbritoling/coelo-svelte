<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import {
		Plus,
		Search,
		ChevronRight,
		Clock,
		Sparkles,
		ChevronLeft,
		LoaderCircle
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { toast } from 'svelte-sonner';
	import ServiceForm from '$lib/components/app/service-form.svelte';
	import { fly } from 'svelte/transition';

	let { data } = $props();

	let services = $state<any[]>(data.services);
	$effect(() => {
		services = data.services;
	});

	let openForm = $state(false);
	let openDelete = $state(false);
	let selectedService = $state<any>(null);
	let searchQuery = $state('');
	let switchVersion = $state(0);

	let filteredServices = $derived(
		services.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function startCreate() {
		selectedService = null;
		openForm = true;
	}

	function startEdit(service: any) {
		selectedService = service;
		openForm = true;
	}

	$effect(() => {
		ui.isModalOpen = openForm || openConfirmToggle || openDelete;
	});

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

	function getServiceColorStyles(colorHex: string) {
		const baseColor = colorHex || '#71717a';
		return {
			bg: `${baseColor}12`, // Opacidade ultra-fina de 12% para o fundo do ícone
			text: baseColor
		};
	}
</script>

<div class="mx-auto flex min-h-full max-w-xl flex-col pb-28" in:fly={{ x: 16, duration: 250 }}>
	<header class="flex flex-col gap-4 px-6 pt-8 pb-3">
		<div>
			<div class="flex items-center gap-3">
				<button
					onclick={() => goto('/mais')}
					class="-ml-2.5 flex size-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/40 bg-white/50 text-zinc-500 backdrop-blur-sm transition-all hover:border-zinc-300/80 hover:bg-white hover:text-zinc-800 active:scale-90"
					aria-label="Voltar para configurações"
				>
					<ChevronLeft size={20} strokeWidth={2.5} />
				</button>
				<h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Serviços</h1>
			</div>
			<p class="mt-1.5 text-[13px] font-medium text-zinc-500">
				Gerencie seus procedimentos e tempos.
			</p>
		</div>

		<div class="relative mt-1">
			<Search class="absolute top-3.5 left-4 z-10 size-4 text-zinc-400" />
			<Input
				type="search"
				placeholder="Procurar serviço..."
				class="h-11 rounded-[16px] border border-zinc-200/40 bg-white/40 pl-11 text-[15px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] backdrop-blur-md transition-all placeholder:text-zinc-400 focus-visible:border-zinc-300/80 focus-visible:bg-white/90 focus-visible:ring-1 focus-visible:ring-zinc-200/60"
				bind:value={searchQuery}
			/>
		</div>
	</header>

	<div class="flex-1 space-y-3.5 overflow-y-auto px-4 pb-32">
		{#each filteredServices as service (service.id)}
			{@const colors = getServiceColorStyles(service.service_color)}
			<div
				class="group relative flex w-full flex-col overflow-hidden rounded-[22px] border border-zinc-200/40 bg-gradient-to-b from-white/80 to-white/50 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] backdrop-blur-md transition-all hover:border-zinc-300/60 hover:shadow-[0_6px_16px_rgba(0,0,0,0.02)]"
			>
				<button
					onclick={() => startEdit(service)}
					class="flex cursor-pointer items-center gap-4 text-left"
				>
					<div
						class="flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-200/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] transition-transform duration-300 group-hover:scale-105"
						style="background-color: {colors.bg}; color: {colors.text};"
					>
						<Sparkles size={19} class="stroke-[2.2]" />
					</div>

					<div class="min-w-0 flex-1">
						<p
							class="truncate text-[15px] font-semibold tracking-tight text-zinc-900 transition-opacity {!service.is_active
								? 'opacity-40'
								: ''}"
						>
							{service.name}
						</p>

						<div class="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] font-medium">
							<span class="flex items-center gap-1 text-zinc-400">
								<Clock class="size-3.5 text-zinc-300" />
								{service.duration} min
							</span>

							{#if service.buffer_after_min > 0}
								<span
									class="rounded-md border border-zinc-200/30 bg-zinc-100/40 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 backdrop-blur-[2px]"
								>
									+{service.buffer_after_min}m intervalo
								</span>
							{/if}
						</div>
					</div>

					<ChevronRight
						class="size-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
					/>
				</button>

				<div class="mt-3.5 flex items-center justify-between border-t border-zinc-100/60 pt-3">
					<span class="text-[10.5px] font-bold tracking-wider text-zinc-400 uppercase">
						{service.is_active ? 'Visível para clientes' : 'Oculto na agenda'}
					</span>
					{#key switchVersion}
						<Switch checked={service.is_active} onCheckedChange={(v) => handleToggle(service, v)} />
					{/key}
				</div>
			</div>
		{:else}
			<div class="py-20 text-center px-4">
				<p class="text-sm font-medium text-zinc-400 italic">Nenhum serviço encontrado.</p>
			</div>
		{/each}
	</div>
</div>

<div class="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style="bottom: 100px">
	<div class="relative flex w-full max-w-md justify-end px-6">
		<button
			onclick={startCreate}
			class="pointer-events-auto flex size-[52px] cursor-pointer items-center justify-center rounded-full border border-white/60 bg-white/70 text-zinc-900 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-1 ring-zinc-950/[0.03] backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] active:translate-y-0 active:scale-95"
			aria-label="Novo serviço"
		>
			<Plus class="size-5.5 text-zinc-800" />
		</button>
	</div>
</div>

<ServiceForm formData={data.form} service={selectedService} bind:open={openForm} />

<AlertDialog.Root bind:open={openConfirmToggle}>
	<AlertDialog.Content
		class="max-w-[calc(100vw-32px)] rounded-[28px] border border-zinc-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:max-w-[400px]"
	>
		<AlertDialog.Header class="text-left">
			<AlertDialog.Title class="text-xl font-bold tracking-tight text-zinc-900"
				>Desativar sua agenda?</AlertDialog.Title
			>
			<AlertDialog.Description class="pt-1 text-[14px] leading-relaxed text-zinc-500">
				Este é seu único serviço ativo. Se desativá-lo, ninguém conseguirá agendar horários com você
				através do seu link público.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex flex-col gap-2.5 pt-5 sm:flex-col">
			<Button
				variant="destructive"
				class="h-12 w-full rounded-[16px] font-semibold shadow-sm shadow-red-900/10 transition-all"
				onclick={() => {
					executeToggle(servicePendingToggle.id, false);
					openConfirmToggle = false;
				}}
			>
				Ocultar Agenda
			</Button>
			<AlertDialog.Cancel
				class="h-12 w-full rounded-[16px] border border-zinc-200 bg-white/80 font-semibold text-zinc-800 backdrop-blur-sm transition-all hover:bg-zinc-50"
				onclick={() => {
					openConfirmToggle = false;
					switchVersion++;
				}}
			>
				Manter Online
			</AlertDialog.Cancel>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	:global(body) {
		background-color: #f4f4f5; /* Um tom ligeiramente mais profundo (zinc-100) para realçar o contraste do vidro branco */
	}
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
