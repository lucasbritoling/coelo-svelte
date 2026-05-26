<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { LoaderCircle, Trash2, Check } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { onsuccess, item = null } = $props();

	let name = $state(item?.name || '');
	let current_stock = $state(item?.current_stock || 0);
	let min_stock_level = $state(item?.min_stock_level || 1);
	let unit = $state(item?.unit || 'un');

	let isLoading = $state(false);
	let isDeleting = $state(false);

	// Estado para o "duplo clique" de confirmação
	let isConfirmingDelete = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	async function handleDelete() {
		// Se não está confirmando ainda, inicia o estado de confirmação
		if (!isConfirmingDelete) {
			isConfirmingDelete = true;
			// Reseta o estado após 3 segundos
			timer = setTimeout(() => {
				isConfirmingDelete = false;
			}, 3000);
			return;
		}

		// Se chegou aqui, é o segundo clique (confirmação)
		clearTimeout(timer);
		isDeleting = true;

		const formData = new FormData();
		formData.append('id', item.id);

		const response = await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (response.ok) {
			toast.success('Item excluído com sucesso.');
			await invalidateAll();
			onsuccess();
		} else {
			toast.error(result.data?.message || 'Erro ao excluir item.');
		}

		isDeleting = false;
		isConfirmingDelete = false;
	}
</script>

<form
	method="POST"
	action="?/upsert"
	class="flex flex-col gap-4"
	use:enhance={() => {
		isLoading = true;
		return async ({ result, update }) => {
			isLoading = false;
			await update();
			if (result.type === 'success') {
				toast.success('Item salvo com sucesso.');
				onsuccess();
			}
		};
	}}
>
	{#if item?.id}
		<input type="hidden" name="id" value={item.id} />
	{/if}

	<div class="flex flex-col gap-1.5">
		<label for="name" class="text-xs font-bold text-zinc-500 uppercase">Nome do Produto</label>
		<input
			id="name"
			type="text"
			name="name"
			bind:value={name}
			required
			class="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-zinc-400 focus:outline-none"
		/>
	</div>

	<div class="flex gap-2">
		<div class="flex w-1/2 flex-col gap-1.5">
			<label for="current_stock" class="text-xs font-bold text-zinc-500 uppercase"
				>Estoque Atual</label
			>
			<input
				id="current_stock"
				type="number"
				name="current_stock"
				bind:value={current_stock}
				required
				class="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-zinc-400 focus:outline-none"
			/>
		</div>
		<div class="flex w-1/2 flex-col gap-1.5">
			<label for="min_stock_level" class="text-xs font-bold text-zinc-500 uppercase">Mínimo</label>
			<input
				id="min_stock_level"
				type="number"
				name="min_stock_level"
				bind:value={min_stock_level}
				required
				class="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-zinc-400 focus:outline-none"
			/>
		</div>
	</div>

	<div class="flex flex-col gap-1.5">
		<label for="unit" class="text-xs font-bold text-zinc-500 uppercase">Unidade de Medida</label>
		<input
			id="unit"
			type="text"
			name="unit"
			bind:value={unit}
			placeholder="ex: ml, g, un"
			required
			class="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm focus:border-zinc-400 focus:outline-none"
		/>
	</div>

	<div class="mt-2 flex items-center gap-3">
		{#if item?.id}
			<button
				type="button"
				onclick={handleDelete}
				disabled={isDeleting || isLoading}
				class="flex items-center justify-center rounded-xl p-3 transition-all duration-200 {isConfirmingDelete
					? 'w-28 bg-rose-600 text-white'
					: 'bg-rose-50 text-rose-600 hover:bg-rose-100'}"
			>
				{#if isDeleting}
					<LoaderCircle class="size-5 animate-spin" />
				{:else if isConfirmingDelete}
					<span class="text-xs font-bold uppercase">Confirmar</span>
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
