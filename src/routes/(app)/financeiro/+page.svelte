<script lang="ts">
	import { TrendingUp, TrendingDown, PlusCircle } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import FinanceiroFab from '$lib/components/app/financeiro/financeiro-fab.svelte';
	import FinanceForm from '$lib/components/app/financeiro/finance-form.svelte';

	let isOpen = $state(false);
	function handleAdd() {
		isOpen = true;
	}

	// Dados hardcoded para prototipagem
	const finance = {
		totalEntradas: 4500.0,
		totalSaidas: 1200.0,
		saldo: 3300.0,
		transacoes: [
			{ id: 1, desc: 'Agendamento: Corte Masculino', valor: 80.0, tipo: 'entrada', data: 'Hoje' },
			{ id: 2, desc: 'Compra: Shampoos', valor: 250.0, tipo: 'saida', data: 'Ontem' },
			{ id: 3, desc: 'Agendamento: Coloração', valor: 220.0, tipo: 'entrada', data: '24/05' },
			{ id: 4, desc: 'Aluguel (Parte)', valor: 800.0, tipo: 'saida', data: '20/05' }
		]
	};

	const formatCurrency = (val: number) =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
</script>

<div class="mx-auto w-full max-w-md p-6 pb-32">
	<h1 class="mb-6 text-2xl font-bold text-zinc-900">Financeiro</h1>

	<div class="mb-8 grid grid-cols-3 gap-3">
		<div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
			<p class="text-[10px] font-bold text-zinc-400 uppercase">Saldo</p>
			<p class="text-lg font-semibold text-zinc-900">{formatCurrency(finance.saldo)}</p>
		</div>
		<div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
			<p class="text-[10px] font-bold text-emerald-600 uppercase">Entradas</p>
			<p class="text-lg font-semibold text-emerald-700">{formatCurrency(finance.totalEntradas)}</p>
		</div>
		<div class="rounded-2xl border border-rose-100 bg-rose-50 p-4">
			<p class="text-[10px] font-bold text-rose-600 uppercase">Saídas</p>
			<p class="text-lg font-semibold text-rose-700">{formatCurrency(finance.totalSaidas)}</p>
		</div>
	</div>

	<div class="mb-4 flex items-center justify-between">
		<h2 class="font-semibold text-zinc-800">Transações Recentes</h2>
	</div>

	<div class="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
		{#each finance.transacoes as t}
			<div class="flex items-center justify-between border-b border-zinc-100 p-4 last:border-0">
				<div class="flex items-center gap-3">
					<div class="rounded-full p-2 {t.tipo === 'entrada' ? 'bg-emerald-100' : 'bg-rose-100'}">
						{#if t.tipo === 'entrada'}
							<TrendingUp size={16} class="text-emerald-600" />
						{:else}
							<TrendingDown size={16} class="text-rose-600" />
						{/if}
					</div>
					<div>
						<p class="text-sm font-medium text-zinc-900">{t.desc}</p>
						<p class="text-[11px] text-zinc-400">{t.data}</p>
					</div>
				</div>
				<p class="text-sm font-bold {t.tipo === 'entrada' ? 'text-emerald-600' : 'text-zinc-900'}">
					{t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
				</p>
			</div>
		{/each}
	</div>
</div>

<div class="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style="bottom: 100px">
	<div class="relative flex w-full max-w-md justify-end px-6">
		<FinanceiroFab onclick={handleAdd} />
	</div>
</div>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end bg-black/20 backdrop-blur-sm sm:items-center sm:justify-center"
		onclick={() => (isOpen = false)}
		role="presentation"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			transition:fly={{ y: 100, duration: 250 }}
		>
			<h2 class="mb-5 text-lg font-bold text-zinc-900">Nova Transação</h2>

			<FinanceForm
				onsubmit={(data) => {
					console.log('Dados do formulário:', data);
					isOpen = false;
				}}
			/>
		</div>
	</div>
{/if}
