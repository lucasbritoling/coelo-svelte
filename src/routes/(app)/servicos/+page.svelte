<script lang="ts">
	import { Plus, Search, Trash2, LoaderCircle, ChevronRight } from '@lucide/svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import ServiceForm from '$lib/components/dashboard/service-form.svelte';

	let { data } = $props();

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

	let filteredServices = $derived(
		services.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

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

		if (!lockAxis) {
			lockAxis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
		}
		if (lockAxis === 'h') e.preventDefault(); // prevent scroll during horizontal swipe
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

	// ── Actions ────────────────────────────────────────────────────
	function startCreate() {
		selectedService = null;
		openForm = true;
	}

	function startEdit(service: any) {
		if (swipedId === service.id) {
			swipedId = null;
			return;
		}
		selectedService = service;
		openForm = true;
	}

	function confirmDelete(service: any) {
		swipedId = null;
		serviceToDelete = { id: service.id, name: service.name };
		openDelete = true;
	}

	function toggleActive(serviceId: string, newValue: boolean) {
		const input = document.getElementById(`check-${serviceId}`) as HTMLInputElement;
		if (!input) return;
		input.value = String(newValue);
		setTimeout(() => {
			(document.getElementById(`form-status-${serviceId}`) as HTMLFormElement)?.requestSubmit();
		}, 50);
	}

	let servicePendingToggle = $state<any>(null);
	let openConfirmToggle = $state(false);

	function handleToggleAttempt(service: any, newValue: boolean) {
		const activeServices = services.filter((s: any) => s.is_active);
		if (!newValue && activeServices.length === 1 && activeServices[0].id === service.id) {
			servicePendingToggle = service;
			openConfirmToggle = true;
			const idx = services.findIndex((s: any) => s.id === service.id);
			if (idx !== -1) services[idx] = { ...services[idx], is_active: false };
			return;
		}
		const idx = services.findIndex((s: any) => s.id === service.id);
		if (idx !== -1) services[idx] = { ...services[idx], is_active: newValue };
		toggleActive(service.id, newValue);
	}

	function confirmToggle() {
		if (servicePendingToggle) {
			toggleActive(servicePendingToggle.id, false);
			servicePendingToggle = null;
			openConfirmToggle = false;
		}
	}

	function cancelToggle() {
		if (servicePendingToggle) {
			const idx = services.findIndex((s: any) => s.id === servicePendingToggle.id);
			if (idx !== -1) services[idx] = { ...services[idx], is_active: true };
			servicePendingToggle = null;
		}
		openConfirmToggle = false;
	}
</script>

<!-- Overlay que fecha qualquer row aberta ao tocar fora -->
{#if swipedId}
	<div
		class="fixed inset-0 z-10"
		role="presentation"
		onclick={closeSwipe}
		ontouchstart={closeSwipe}
	></div>
{/if}

<!-- ───────────────────────── MOBILE ───────────────────────────── -->
<div class="flex w-full flex-col gap-4 p-4 pb-28 sm:hidden">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Serviços</h1>
		<p class="text-sm text-muted-foreground">Regras e tempos de atendimento.</p>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
		<Input type="search" placeholder="Procurar serviço..." class="pl-9" bind:value={searchQuery} />
	</div>

	<!-- Hint de swipe (some depois da primeira interação) -->
	{#if services.length > 0}
		<p class="text-center text-[11px] text-muted-foreground/60 select-none">
			← Deslize para excluir · Toque para editar
		</p>
	{/if}

	<!-- Lista com swipe -->
	<div class="overflow-hidden rounded-2xl border bg-background shadow-sm">
		{#each filteredServices as service (service.id)}
			<div class="relative overflow-hidden border-b last:border-b-0">
				<!-- Fundo vermelho (ação de deletar) -->
				<div
					class="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-destructive transition-opacity"
					class:pointer-events-none={swipedId !== service.id}
					class:opacity-0={swipedId !== service.id}
					class:opacity-100={swipedId === service.id}
				>
					<button
						class="flex h-full w-full flex-col items-center justify-center gap-1 text-white active:opacity-70"
						onclick={() => confirmDelete(service)}
					>
						<Trash2 class="size-5" />
						<span class="text-[10px] font-semibold tracking-wide">Excluir</span>
					</button>
				</div>

				<!-- Conteúdo deslizável -->
				<div
					class="relative z-20 flex items-center gap-3 bg-background px-4 py-3.5 will-change-transform"
					class:opacity-40={!service.is_active}
					class:transition-transform={!touching}
					style="transform: translateX({swipedId === service.id
						? SWIPE_OPEN_X
						: 0}px); touch-action: pan-y;"
					ontouchstart={(e) => onTouchStart(e, service.id)}
					ontouchmove={(e) => onTouchMove(e, service.id)}
					ontouchend={(e) => onTouchEnd(e, service.id)}
					role="button"
					tabindex="0"
					onclick={() => startEdit(service)}
					onkeydown={(e) => e.key === 'Enter' && startEdit(service)}
				>
					<!-- Info -->
					<div class="min-w-0 flex-1">
						<p class="truncate leading-snug font-semibold">{service.name}</p>
						<div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
							<span>{service.duration} min</span>
							{#if service.buffer_after_min > 0}
								<span
									class="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
								>
									+{service.buffer_after_min} min
								</span>
							{/if}
							{#if service.min_notice_hours}
								<span class="rounded-full bg-muted px-2 py-0.5">
									{service.min_notice_hours}h antecedência
								</span>
							{/if}
						</div>
					</div>

					<form
						id="form-status-{service.id}"
						method="POST"
						action="?/updateStatus"
						use:enhance={() =>
							async ({ result }) => {
								if (result.type === 'failure') {
									toast.error('Erro ao atualizar status.');
									const idx = services.findIndex((s) => s.id === service.id);
									if (idx !== -1)
										services[idx] = { ...services[idx], is_active: !services[idx].is_active };
								}
							}}
						onclick={(e) => e.stopPropagation()}
						ontouchstart={(e) => e.stopPropagation()}
						ontouchmove={(e) => e.stopPropagation()}
						ontouchend={(e) => e.stopPropagation()}
					>
						<input type="hidden" name="id" value={service.id} />
						<input
							type="hidden"
							name="is_active"
							id="check-{service.id}"
							value={service.is_active}
						/>
						<Switch
							checked={service.is_active}
							onCheckedChange={(v) => handleToggleAttempt(service, v)}
						/>
					</form>

					<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2 py-16 text-center">
				<p class="text-sm italic text-muted-foreground">Nenhum serviço encontrado.</p>
			</div>
		{/each}
	</div>
</div>

<!-- FAB -->
<button
	onclick={startCreate}
	class="
		fixed right-4 z-30 flex items-center gap-2
		rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground
		shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-150
		active:scale-95 active:shadow-sm sm:hidden
	"
	style="bottom: calc(4rem + 1rem + env(safe-area-inset-bottom))"
	aria-label="Novo Serviço"
>
	<Plus class="size-5" />
	Novo Serviço
</button>

<!-- ─────────────────────── DESKTOP ────────────────────────────── -->
<div class="mx-auto hidden w-full max-w-lg flex-col gap-6 p-6 sm:flex">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Serviços</h1>
			<p class="text-sm text-muted-foreground">Regras e tempos de atendimento.</p>
		</div>
		<Button onclick={startCreate} size="sm" class="h-9 shrink-0 cursor-pointer">
			<Plus class="mr-2 h-4 w-4" /> Novo Serviço
		</Button>
	</div>

	<div class="relative">
		<Search class="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
		<Input type="search" placeholder="Procurar serviço..." class="pl-9" bind:value={searchQuery} />
	</div>

	<div class="overflow-x-auto rounded-md border">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b bg-muted/50 text-left font-medium">
					<th class="p-3">Nome</th>
					<th class="p-3">Duração</th>
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
						<td class="p-3 font-medium">
							{service.name}
							{#if service.min_notice_hours}
								<p class="text-[11px] font-normal text-muted-foreground">
									{service.min_notice_hours}h de antecedência
								</p>
							{/if}
						</td>
						<td class="p-3">
							<div class="flex items-center gap-2 text-muted-foreground">
								{service.duration} min
								{#if service.buffer_after_min > 0}
									<span class="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700"
										>+{service.buffer_after_min} min</span
									>
								{/if}
							</div>
						</td>
						<td class="p-3">
							<form
								id="form-status-{service.id}"
								method="POST"
								action="?/updateStatus"
								use:enhance={() =>
									async ({ result }) => {
										if (result.type === 'failure') {
											toast.error('Erro ao atualizar status.');
											const idx = services.findIndex((s) => s.id === service.id);
											if (idx !== -1)
												services[idx] = { ...services[idx], is_active: !services[idx].is_active };
										}
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
									checked={service.is_active}
									onCheckedChange={(v) => handleToggleAttempt(service, v)}
								/>
							</form>
						</td>
						<td class="p-3 text-right">
							<div class="flex justify-end gap-1">
								<Button
									variant="ghost"
									size="icon"
									class="cursor-pointer"
									onclick={() => startEdit(service)}
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
									onclick={() => confirmDelete(service)}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="p-8 text-center italic text-muted-foreground"
							>Nenhum serviço encontrado.</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- ─────────────────── Dialogs / Drawers ──────────────────────── -->
<ServiceForm formData={data.form} service={selectedService} bind:open={openForm} />

<AlertDialog.Root
	bind:open={openConfirmToggle}
	onOpenChange={(open) => {
		if (!open && servicePendingToggle) cancelToggle();
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Desativar último serviço?</AlertDialog.Title>
			<AlertDialog.Description>
				Se você desativar <strong>{servicePendingToggle?.name}</strong>, sua agenda pública ficará
				offline.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex-col-reverse gap-2 sm:flex-row">
			<AlertDialog.Cancel onclick={cancelToggle} class="w-full cursor-pointer sm:w-auto">
				Manter Ativo
			</AlertDialog.Cancel>
			<Button variant="destructive" onclick={confirmToggle} class="w-full cursor-pointer sm:w-auto">
				Confirmar e Desativar
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={openDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir serviço?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta ação não pode ser desfeita. Remover <strong>{serviceToDelete?.name}</strong>?
				{#if services.length === 1}
					<div class="mt-2 font-bold text-destructive">
						Atenção: Este é seu último serviço. Sua agenda ficará indisponível.
					</div>
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex-col-reverse gap-2 sm:flex-row">
			<AlertDialog.Cancel disabled={isLoading} class="w-full cursor-pointer sm:w-auto"
				>Cancelar</AlertDialog.Cancel
			>
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
							toast.success('Ok');
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
					class="w-full cursor-pointer sm:min-w-36"
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 size-4 animate-spin" /> Removendo...
					{:else}
						Confirmar Exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
