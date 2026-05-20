<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, Check } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	// Cores atualizadas para paletas Premium Pastel com anel interno sutil
	const colorsMap = {
		zinc: 'bg-zinc-500 border-zinc-600/30 text-white',
		blue: 'bg-sky-500 border-sky-600/30 text-white',
		indigo: 'bg-indigo-500 border-indigo-600/30 text-white',
		violet: 'bg-violet-500 border-violet-600/30 text-white',
		rose: 'bg-rose-500 border-rose-600/30 text-white',
		amber: 'bg-amber-500 border-amber-600/30 text-white',
		emerald: 'bg-emerald-500 border-emerald-600/30 text-white'
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
		class="flex max-h-[92dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[28px] border border-zinc-200/50 bg-white/85 p-0 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:max-w-[380px]"
	>
		<Dialog.Header class="px-5 pt-5 pb-3 text-left">
			<Dialog.Title class="text-[17px] font-semibold tracking-tight text-zinc-900">
				{formState.id ? 'Editar serviço' : 'Novo serviço'}
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
						toast.success(isDelete ? 'Serviço excluído com sucesso' : 'Alterações salvas!');
						open = false;
					} else if (result.type === 'failure') {
						toast.error(result.data?.message ?? 'Erro ao processar requisição');
						isConfirmingDelete = false;
					}
				};
			}}
			class="flex flex-1 flex-col overflow-hidden"
		>
			<input type="hidden" name="id" value={formState.id} />
			<input type="hidden" name="color" value={formState.color} />
			<input type="hidden" name="is_active" value={String(formState.is_active)} />

			<div class="max-h-[55dvh] space-y-4 overflow-y-auto px-5 pb-6">
				<div class="grid gap-1.5">
					<Label class="text-[10.5px] font-bold tracking-wider text-zinc-400 uppercase"
						>Nome do serviço</Label
					>
					<Input
						name="name"
						bind:value={formState.name}
						placeholder="Ex: Alinhamento de Barba"
						class="h-11 rounded-[14px] border-zinc-200/80 bg-zinc-50/40 text-[14.5px] transition-colors placeholder:text-zinc-400 focus-visible:bg-white focus-visible:ring-zinc-300"
						required
					/>
				</div>

				<div class="grid grid-cols-2 gap-3.5">
					<div class="grid gap-1.5">
						<Label class="text-[10.5px] font-bold tracking-wider text-zinc-400 uppercase"
							>Duração</Label
						>
						<div class="relative">
							<Clock class="pointer-events-none absolute top-3.5 left-3.5 size-4 text-zinc-400" />
							<Input
								name="duration"
								type="text"
								inputmode="numeric"
								bind:value={formState.duration}
								class="h-11 rounded-[14px] border-zinc-200/80 bg-zinc-50/40 pr-11 pl-9.5 text-[14.5px] font-bold text-zinc-900 transition-colors focus-visible:bg-white focus-visible:ring-zinc-300"
								required
								oninput={(e) => {
									formState.duration = Number(e.currentTarget.value.replace(/\D/g, ''));
								}}
							/>
							<span
								class="pointer-events-none absolute top-3.5 right-3.5 text-[12px] font-semibold text-zinc-400"
								>min</span
							>
						</div>
					</div>

					<div class="grid gap-1.5">
						<Label class="text-[10.5px] font-bold tracking-wider text-zinc-400 uppercase"
							>Antecedência</Label
						>
						<div class="relative">
							<Input
								name="min_notice_hours"
								type="text"
								inputmode="numeric"
								bind:value={formState.min_notice_hours}
								class="h-11 rounded-[14px] border-zinc-200/80 bg-zinc-50/40 pr-11 text-center text-[14.5px] font-bold text-zinc-900 transition-colors focus-visible:bg-white focus-visible:ring-zinc-300"
								oninput={(e) => {
									formState.min_notice_hours = Number(e.currentTarget.value.replace(/\D/g, ''));
								}}
							/>
							<span
								class="pointer-events-none absolute top-3.5 right-3.5 text-[12px] font-semibold text-zinc-400"
								>hrs</span
							>
						</div>
					</div>
				</div>

				<div class="grid gap-2 pt-1">
					<Label class="text-[10.5px] font-bold tracking-wider text-zinc-400 uppercase"
						>Cor de identificação</Label
					>
					<div class="flex flex-wrap gap-2">
						{#each Object.keys(colorsMap) as colorKey}
							<button
								type="button"
								class="relative size-6.5 cursor-pointer rounded-full border transition-all hover:scale-105 active:scale-95 {colorsMap[
									colorKey as ServiceColor
								]} {formState.color === colorKey
									? 'ring-2 ring-zinc-900 ring-offset-2'
									: 'hover:border-zinc-400/50'}"
								onclick={() => (formState.color = colorKey as ServiceColor)}
								title={colorKey}
							>
								{#if formState.color === colorKey}
									<div class="absolute inset-0 flex items-center justify-center">
										<Check size={11} strokeWidth={3.5} />
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div
				class="flex gap-2.5 border-t border-zinc-100 bg-zinc-50/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md"
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
						class="h-11 flex-1 cursor-pointer rounded-[14px] text-[13px] font-semibold shadow-sm shadow-red-900/[0.04] transition-all"
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
					class="h-11 {formState.id
						? 'flex-[1.6]'
						: 'w-full'} cursor-pointer rounded-[14px] bg-zinc-900 text-[13px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-300"
				>
					{#if isLoading}
						<LoaderCircle class="mr-1.5 size-4 animate-spin" />
					{:else}
						{isConfirmingDelete ? 'Cancelar' : 'Salvar serviço'}
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
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
