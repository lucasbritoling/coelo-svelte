<script lang="ts">
	import { TrendingUp, TrendingDown } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import FinanceiroFab from '$lib/components/app/financeiro/financeiro-fab.svelte';
	import FinanceForm from '$lib/components/app/financeiro/finance-form.svelte';

	let { data } = $props();
	let isOpen = $state(false);
	let selectedTransaction = $state<any>(null); // Estado para a transação clicada

	// Cálculos reativos usando os dados do banco
	let totalEntradas = $derived(
		data.transactions
			.filter((t: any) => t.type === 'entrada')
			.reduce((acc: number, t: any) => acc + Number(t.amount), 0)
	);

	let totalSaidas = $derived(
		data.transactions
			.filter((t: any) => t.type === 'saida')
			.reduce((acc: number, t: any) => acc + Number(t.amount), 0)
	);

	let saldo = $derived(totalEntradas - totalSaidas);

	const formatCurrency = (val: number) =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
	};

	function openEdit(t: any) {
		selectedTransaction = t;
		isOpen = true;
	}

	function handleClose() {
		isOpen = false;
		selectedTransaction = null;
	}
</script>

<div class="mx-auto w-full max-w-md p-6 pb-32">
	<h1 class="mb-6 text-2xl font-bold text-zinc-900">Financeiro</h1>

	<div class="mb-8 grid grid-cols-3 gap-3">
		<div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
			<p class="text-[10px] font-bold text-zinc-400 uppercase">Saldo</p>
			<p class="text-lg font-semibold text-zinc-900">{formatCurrency(saldo)}</p>
		</div>
		<div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
			<p class="text-[10px] font-bold text-emerald-600 uppercase">Entradas</p>
			<p class="text-lg font-semibold text-emerald-700">{formatCurrency(totalEntradas)}</p>
		</div>
		<div class="rounded-2xl border border-rose-100 bg-rose-50 p-4">
			<p class="text-[10px] font-bold text-rose-600 uppercase">Saídas</p>
			<p class="text-lg font-semibold text-rose-700">{formatCurrency(totalSaidas)}</p>
		</div>
	</div>

	<div class="mb-4 flex items-center justify-between">
		<h2 class="font-semibold text-zinc-800">Transações Recentes</h2>
	</div>

	<div class="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
		{#each data.transactions as t}
			<button
				type="button"
				class="flex w-full items-center justify-between border-b border-zinc-100 p-4 last:border-0 hover:bg-zinc-50"
				onclick={() => openEdit(t)}
			>
				<div class="flex items-center gap-3">
					<div class="rounded-full p-2 {t.type === 'entrada' ? 'bg-emerald-100' : 'bg-rose-100'}">
						{#if t.type === 'entrada'}
							<TrendingUp size={16} class="text-emerald-600" />
						{:else}
							<TrendingDown size={16} class="text-rose-600" />
						{/if}
					</div>
					<div class="text-left">
						<p class="text-sm font-medium text-zinc-900">{t.description}</p>
						<p class="text-[11px] text-zinc-400">{formatDate(t.transaction_date)}</p>
					</div>
				</div>
				<p class="text-sm font-bold {t.type === 'entrada' ? 'text-emerald-600' : 'text-zinc-900'}">
					{t.type === 'entrada' ? '+' : '-'}{formatCurrency(Number(t.amount))}
				</p>
			</button>
		{:else}
			<div class="p-8 text-center text-sm text-zinc-500">Nenhuma transação registrada.</div>
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
				{selectedTransaction ? 'Editar Transação' : 'Nova Transação'}
			</h2>

			<FinanceForm
				services={data.services}
				transaction={selectedTransaction}
				onsuccess={handleClose}
			/>
		</div>
	</div>
{/if}
