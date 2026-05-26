<script lang="ts">
	import { enhance } from '$app/forms';
	import { LoaderCircle, Trash2 } from '@lucide/svelte';

	let { onsuccess, services = [], transaction = null } = $props();

	// Estado inicial (se for edição, preenche com os dados da transação)
	let desc = $state(transaction?.description || '');
	let valor = $state(transaction?.amount || '');
	let tipo = $state(transaction?.type || 'saida');
	let serviceId = $state(''); // Em um cenário real de edição, você precisaria buscar o ID do serviço pelo nome
	let isLoading = $state(false);
	let isDeleting = $state(false);

	// Monta a descrição final para enviar ao banco
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
			if (result.type === 'success') onsuccess();
		};
	}}
>
	<input type="hidden" name="type" value={tipo} />
	<input type="hidden" name="desc" value={finalDesc} />
	{#if transaction}
		<input type="hidden" name="id" value={transaction.id} />
	{/if}

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

	<div class="mt-2 flex items-center gap-3">
		{#if transaction}
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result, update }) => {
						await update();
						isDeleting = false;
						if (result.type === 'success') onsuccess();
					};
				}}
			>
				<input type="hidden" name="id" value={transaction.id} />
				<button
					type="submit"
					disabled={isDeleting}
					class="flex items-center justify-center rounded-xl bg-rose-50 p-3 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
				>
					{#if isDeleting}
						<LoaderCircle class="size-5 animate-spin" />
					{:else}
						<Trash2 size={20} />
					{/if}
				</button>
			</form>
		{/if}

		<button
			type="submit"
			disabled={isLoading}
			class="flex flex-1 items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-70"
		>
			{#if isLoading}
				<LoaderCircle class="mr-2 size-4 animate-spin" />
				Salvando...
			{:else}
				{transaction ? 'Atualizar Transação' : 'Salvar Transação'}
			{/if}
		</button>
	</div>
</form>
