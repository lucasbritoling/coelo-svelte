<script lang="ts">
	import { AlertTriangle, Package } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import FinanceiroFab from '$lib/components/app/financeiro/financeiro-fab.svelte';
	import InventoryForm from '$lib/components/app/estoque/InventoryForm.svelte';

	let { data } = $props();
	let estoque = $derived(data.inventory);
	let isOpen = $state(false);
	let selectedItem = $state<any>(null);

	const formatStatus = (atual: number, minimo: number) => {
		if (atual == 0) return { label: 'Esgotado', color: 'text-rose-600', bg: 'bg-rose-50' };
		if (atual <= minimo) return { label: 'Baixo', color: 'text-amber-600', bg: 'bg-amber-50' };
		return { label: 'Ok', color: 'text-emerald-600', bg: 'bg-emerald-50' };
	};

	function openEdit(item: any) {
		selectedItem = item;
		isOpen = true;
	}

	function handleClose() {
		isOpen = false;
		selectedItem = null;
	}
</script>

<div class="mx-auto w-full max-w-md p-6 pb-32">
	<h1 class="mb-6 text-2xl font-bold text-zinc-900">Estoque</h1>

	<div class="mb-8 grid grid-cols-2 gap-3">
		<div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
			<p class="text-[10px] font-bold text-zinc-400 uppercase">Total Itens</p>
			<p class="text-lg font-semibold text-zinc-900">{estoque.length}</p>
		</div>
		<div class="rounded-2xl border border-amber-100 bg-amber-50 p-4">
			<p class="text-[10px] font-bold text-amber-600 uppercase">Atenção</p>
			<p class="text-lg font-semibold text-amber-700">
				{estoque.filter((i) => i.current_stock <= i.min_stock_level).length} itens
			</p>
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
		{#each estoque as item}
			{@const status = formatStatus(Number(item.current_stock), Number(item.min_stock_level))}
			<button
				type="button"
				class="flex w-full items-center justify-between border-b border-zinc-100 p-4 last:border-0 hover:bg-zinc-50"
				onclick={() => openEdit(item)}
			>
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-zinc-100 p-2">
						<Package size={16} class="text-zinc-600" />
					</div>
					<div class="text-left">
						<p class="text-sm font-medium text-zinc-900">{item.name}</p>
						<p class="text-[11px] text-zinc-400">
							Estoque: {item.current_stock} / Mín: {item.min_stock_level}
							{item.unit}
						</p>
					</div>
				</div>
				<div class="flex flex-col items-end">
					<span
						class="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase {status.bg} {status.color}"
					>
						{status.label}
					</span>
					{#if item.current_stock <= item.min_stock_level}
						<AlertTriangle size={14} class="mt-1 text-amber-500" />
					{/if}
				</div>
			</button>
		{:else}
			<div class="p-8 text-center text-sm text-zinc-500">Nenhum item cadastrado.</div>
		{/each}
	</div>
</div>

<div class="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style="bottom: 100px">
	<div class="relative flex w-full max-w-md justify-end px-6">
		<FinanceiroFab onclick={() => (isOpen = true)} />
	</div>
</div>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end bg-black/20 backdrop-blur-sm sm:items-center sm:justify-center"
		onclick={handleClose}
		role="presentation"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			transition:fly={{ y: 100, duration: 250 }}
		>
			<h2 class="mb-5 text-lg font-bold text-zinc-900">
				{selectedItem ? 'Editar Item' : 'Novo Item no Estoque'}
			</h2>

			<InventoryForm item={selectedItem} onsuccess={handleClose} />
		</div>
	</div>
{/if}
