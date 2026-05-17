<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, Check } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	const colorsMap = {
		zinc: 'bg-zinc-500 border-zinc-600',
		blue: 'bg-blue-500 border-blue-600',
		indigo: 'bg-indigo-500 border-indigo-600',
		violet: 'bg-violet-500 border-violet-600',
		rose: 'bg-rose-500 border-rose-600',
		amber: 'bg-amber-500 border-amber-600',
		emerald: 'bg-emerald-500 border-emerald-600'
	} as const;

	type ServiceColor = keyof typeof colorsMap;

	interface Service {
		id?: string;
		name: string;
		duration: number;
		min_notice_hours: number;
		buffer_after_min: number;
		is_active: boolean;
		color: ServiceColor;
	}

	let {
		service = null,
		open = $bindable(),
		initialName = ''
	} = $props<{
		service?: Service | null;
		open: boolean;
		initialName?: string;
	}>();

	let isLoading = $state(false);
	let isConfirmingDelete = $state(false);

	let formState = $state<Service>({
		id: '',
		name: '',
		duration: 30,
		min_notice_hours: 2,
		buffer_after_min: 0,
		is_active: true,
		color: 'blue'
	});

	// Sincronização de estado centralizada
	$effect(() => {
		if (open) {
			formState = {
				id: service?.id ?? '',
				name: service?.name ?? initialName,
				duration: service?.duration ?? 30,
				min_notice_hours: service?.min_notice_hours ?? 2,
				buffer_after_min: service?.buffer_after_min ?? 0,
				is_active: service?.is_active ?? true,
				color: service?.color ?? 'blue'
			};
		} else {
			isConfirmingDelete = false;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[92dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[24px] p-0 sm:max-w-[380px]"
	>
		<Dialog.Header class="px-5 pt-4 pb-2 text-left">
			<Dialog.Title class="text-base font-bold text-zinc-900">
				{formState.id ? 'Editar Serviço' : 'Novo Serviço'}
			</Dialog.Title>
		</Dialog.Header>

		<form
			method="POST"
			action="/servicos?/upsert"
			use:enhance={({ action }) => {
				isLoading = true;
				const isDelete = action.search.includes('delete');

				return async ({ result, update }) => {
					await update({ reset: false, invalidateAll: true });
					isLoading = false;

					if (result.type === 'success') {
						toast.success(isDelete ? 'Serviço excluído' : 'Serviço salvo');
						open = false;
					} else if (result.type === 'failure') {
						toast.error(result.data?.message ?? 'Erro na operação');
						isConfirmingDelete = false;
					}
				};
			}}
			class="flex flex-1 flex-col overflow-hidden"
		>
			<input type="hidden" name="id" value={formState.id} />
			<input type="hidden" name="color" value={formState.color} />
			<input type="hidden" name="is_active" value={String(formState.is_active)} />

			<!-- Área rolável apenas se a tela for muito pequena -->
			<div class="max-h-[55dvh] space-y-3 overflow-y-auto px-5 pb-4">
				<!-- Campo Nome -->
				<div class="grid gap-1">
					<Label class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
						>Nome do Serviço</Label
					>
					<Input
						name="name"
						bind:value={formState.name}
						placeholder="Ex: Corte de Cabelo"
						class="h-10 rounded-xl bg-zinc-50/50"
						required
					/>
				</div>

				<!-- Grid de Duração e Antecedência combinados na horizontal -->
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-1">
						<Label class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
							>Duração</Label
						>
						<div class="relative">
							<Clock class="absolute top-3 left-3 size-4 text-zinc-400" />
							<Input
								name="duration"
								type="text"
								inputmode="numeric"
								bind:value={formState.duration}
								class="h-10 rounded-xl bg-zinc-50/50 pl-9 font-semibold"
								required
								oninput={(e) => {
									formState.duration = Number(e.currentTarget.value.replace(/\D/g, ''));
								}}
							/>
							<span class="absolute top-2.5 right-3 text-xs font-medium text-zinc-400">min</span>
						</div>
					</div>

					<div class="grid gap-1">
						<Label class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
							>Antecedência</Label
						>
						<div class="relative">
							<Input
								name="min_notice_hours"
								type="text"
								inputmode="numeric"
								bind:value={formState.min_notice_hours}
								class="h-10 rounded-xl bg-zinc-50/50 pr-8 text-center font-semibold"
								oninput={(e) => {
									formState.min_notice_hours = Number(e.currentTarget.value.replace(/\D/g, ''));
								}}
							/>
							<span class="absolute top-2.5 right-3 text-xs font-medium text-zinc-400">hrs</span>
						</div>
					</div>
				</div>

				<!-- Seletor de Cores Compacto -->
				<div class="grid gap-1.5 pt-1">
					<Label class="text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
						>Cor de Identificação</Label
					>
					<div class="flex flex-wrap gap-1.5">
						{#each Object.keys(colorsMap) as colorKey}
							<button
								type="button"
								class="relative size-6 rounded-full border transition-transform active:scale-90 {colorsMap[
									colorKey as ServiceColor
								]}"
								onclick={() => (formState.color = colorKey as ServiceColor)}
								title={colorKey}
							>
								{#if formState.color === colorKey}
									<div class="absolute inset-0 flex items-center justify-center text-white">
										<Check size={12} strokeWidth={3} />
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Rodapé Fixo e Compacto -->
			<div
				class="flex gap-2 border-t bg-zinc-50/80 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
			>
				{#if formState.id}
					<Button
						type={isConfirmingDelete ? 'submit' : 'button'}
						variant="destructive"
						formaction="/servicos?/delete"
						onclick={(e) => {
							if (!isConfirmingDelete) {
								e.preventDefault();
								isConfirmingDelete = true;
							}
						}}
						class="h-10 flex-1 rounded-xl text-xs font-semibold"
					>
						{isConfirmingDelete ? 'Confirmar?' : 'Excluir'}
					</Button>
				{/if}

				<Button
					type={isConfirmingDelete ? 'button' : 'submit'}
					disabled={isLoading}
					onclick={() => {
						if (isConfirmingDelete) isConfirmingDelete = false;
					}}
					class="h-10 {formState.id
						? 'flex-[1.5]'
						: 'w-full'} rounded-xl bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800"
				>
					{#if isLoading}
						<LoaderCircle class="mr-1.5 size-3.5 animate-spin" />
					{:else}
						{isConfirmingDelete ? 'Cancelar' : 'Salvar Serviço'}
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<style>
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
