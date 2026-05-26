<script lang="ts">
	import { enhance } from '$app/forms';
	import { LoaderCircle } from '@lucide/svelte';

	let { onsuccess, services = [] } = $props();
	let desc = $state('');
	let valor = $state('');
	let tipo = $state('saida');
	let serviceId = $state('');
	let isLoading = $state(false);

	// Monta a descrição final baseada no tipo para enviar ao banco
	let serviceName = $derived(services.find((s: any) => s.id === serviceId)?.name || '');
	let finalDesc = $derived(tipo === 'entrada' ? 'Agendamento: ' + serviceName : desc);

	function toggleTipo(novoTipo: string) {
		tipo = novoTipo;
		serviceId = '';
		desc = '';
	}
</script>

<form
	method="POST"
	action="?/upsert"
	class="flex flex-col gap-4"
	use:enhance={() => {
		isLoading = true;
		return async ({ result, update }) => {
			await update();
			isLoading = false;
			if (result.type === 'success') {
				onsuccess();
			}
		};
	}}
>
	<input type="hidden" name="type" value={tipo} />
	<input type="hidden" name="desc" value={finalDesc} />

	<div class="flex gap-2">
		<button
			type="button"
			onclick={() => toggleTipo('saida')}
			class="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors {tipo === 'saida'
				? 'bg-rose-100 text-rose-700'
				: 'bg-zinc-100 text-zinc-500'}">Despesa</button
		>
		<button
			type="button"
			onclick={() => toggleTipo('entrada')}
			class="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors {tipo === 'entrada'
				? 'bg-emerald-100 text-emerald-700'
				: 'bg-zinc-100 text-zinc-500'}">Entrada</button
		>
	</div>

	{#if tipo === 'entrada'}
		<select
			bind:value={serviceId}
			name="serviceId"
			required
			class="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm focus:border-zinc-400 focus:outline-none"
		>
			<option value="" disabled selected>Selecione o serviço...</option>
			{#each services as s}
				<option value={s.id}>{s.name} (R$ {s.price})</option>
			{/each}
		</select>
	{:else}
		<input
			type="text"
			bind:value={desc}
			placeholder="Descrição (ex: Café, Materiais...)"
			required
			class="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
		/>
	{/if}

	<input
		type="number"
		name="valor"
		bind:value={valor}
		step="0.01"
		placeholder="Valor (R$)"
		required
		class="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
	/>

	<button
		type="submit"
		disabled={isLoading}
		class="mt-2 flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-70"
	>
		{#if isLoading}
			<LoaderCircle class="mr-2 size-4 animate-spin" />
			Salvando...
		{:else}
			Salvar Transação
		{/if}
	</button>
</form>
