<script>
	let { onsubmit } = $props();
	let desc = $state('');
	let valor = $state('');
	let tipo = $state('saida'); // Padrão 'saida' porque o app já registra entrada via agendamento
</script>

<form
	class="flex flex-col gap-4"
	onsubmit={(e) => {
		e.preventDefault();
		onsubmit({ desc, valor, tipo });
	}}
>
	<div class="flex gap-2">
		<button
			type="button"
			onclick={() => (tipo = 'saida')}
			class="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors {tipo === 'saida'
				? 'bg-rose-100 text-rose-700'
				: 'bg-zinc-100 text-zinc-500'}">Despesa</button
		>
		<button
			type="button"
			onclick={() => (tipo = 'entrada')}
			class="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors {tipo === 'entrada'
				? 'bg-emerald-100 text-emerald-700'
				: 'bg-zinc-100 text-zinc-500'}">Entrada</button
		>
	</div>

	<input
		type="text"
		bind:value={desc}
		placeholder="Descrição (ex: Café, Materiais...)"
		class="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
	/>

	<input
		type="number"
		bind:value={valor}
		placeholder="Valor (R$)"
		class="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
	/>

	<button
		type="submit"
		class="mt-2 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
	>
		Salvar Transação
	</button>
</form>
