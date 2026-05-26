<script lang="ts">
	import { enhance } from '$app/forms';
	import { LoaderCircle, Trash2 } from '@lucide/svelte';

	let { onsuccess, item = null } = $props();

	let name = $state(item?.name || '');
	let current_stock = $state(item?.current_stock || 0);
	let min_stock_level = $state(item?.min_stock_level || 1);
	let unit = $state(item?.unit || 'un');
	let isLoading = $state(false);
	let isDeleting = $state(false);
</script>

<form
	method="POST"
	action="?/upsert"
	class="flex flex-col gap-4"
	use:enhance={({ submitter }) => {
		// Detecta qual botão foi clicado para setar o estado correto
		if (submitter?.getAttribute('formaction') === '?/delete') {
			isDeleting = true;
		} else {
			isLoading = true;
		}

		return async ({ result, update }) => {
			await update();
			isLoading = false;
			isDeleting = false;
			if (result.type === 'success') onsuccess();
		};
	}}
>
	{#if item}
		<input type="hidden" name="id" value={item.id} />
	{/if}

	<input
		type="text"
		name="name"
		bind:value={name}
		placeholder="Nome do produto"
		required
		class="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
	/>

	<div class="flex gap-2">
		<input
			type="number"
			name="current_stock"
			bind:value={current_stock}
			placeholder="Estoque atual"
			required
			class="w-1/2 rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
		/>
		<input
			type="number"
			name="min_stock_level"
			bind:value={min_stock_level}
			placeholder="Estoque mínimo"
			required
			class="w-1/2 rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
		/>
	</div>

	<input
		type="text"
		name="unit"
		bind:value={unit}
		placeholder="Unidade (ex: ml, g, un)"
		required
		class="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:border-zinc-400 focus:outline-none"
	/>

	<div class="mt-2 flex items-center gap-3">
		{#if item}
			<button
				type="submit"
				formaction="?/delete"
				disabled={isDeleting || isLoading}
				class="flex items-center justify-center rounded-xl bg-rose-50 p-3 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
			>
				{#if isDeleting}
					<LoaderCircle class="size-5 animate-spin" />
				{:else}
					<Trash2 size={20} />
				{/if}
			</button>
		{/if}

		<button
			type="submit"
			disabled={isLoading || isDeleting}
			class="flex flex-1 items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-70"
		>
			{#if isLoading}
				<LoaderCircle class="mr-2 size-4 animate-spin" />
				Salvando...
			{:else}
				{item ? 'Atualizar Item' : 'Adicionar Item'}
			{/if}
		</button>
	</div>
</form>
