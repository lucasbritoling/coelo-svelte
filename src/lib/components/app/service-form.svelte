<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, CalendarClock, Palette, Check } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	// Cores disponíveis mapeadas para classes Tailwind correspondentes
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

	$effect(() => {
		if (!open) isConfirmingDelete = false;
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
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-y-auto rounded-[32px] p-0 sm:max-w-[400px]"
	>
		<Dialog.Header class="px-6 py-6 text-left">
			<Dialog.Title class="text-xl font-bold">
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
			class="flex flex-col"
		>
			<input type="hidden" name="id" value={formState.id} />
			<input type="hidden" name="color" value={formState.color} />
			<input type="hidden" name="is_active" value={String(formState.is_active)} />

			<div class="space-y-6 px-6 pb-8">
				<!-- Campo Nome -->
				<div class="grid gap-2">
					<Label class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">Nome</Label>
					<Input
						name="name"
						bind:value={formState.name}
						placeholder="Ex: Agendamento"
						class="h-12 rounded-xl"
						required
					/>
				</div>

				<!-- Campo Duração -->
				<div class="grid gap-2">
					<Label class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase"
						>Duração (minutos)</Label
					>
					<div class="relative">
						<Clock class="absolute top-4 left-4 size-4 text-zinc-400" />
						<Input
							name="duration"
							type="text"
							placeholder="30"
							inputmode="numeric"
							bind:value={formState.duration}
							class="h-12 rounded-xl pl-11 font-bold"
							required
							oninput={(e) => {
								formState.duration = Number(e.currentTarget.value.replace(/\D/g, ''));
							}}
						/>
					</div>
				</div>

				<!-- Seletor de Cores (Enum) -->
				<div class="grid gap-3">
					<Label
						class="flex items-center gap-2 text-[11px] font-bold tracking-widest text-zinc-400 uppercase"
					>
						<Palette size={14} /> Cor Identificadora
					</Label>
					<div class="flex flex-wrap gap-2.5">
						{#each Object.keys(colorsMap) as colorKey}
							<button
								type="button"
								class="relative size-8 rounded-full border transition-transform active:scale-95 {colorsMap[
									colorKey as ServiceColor
								]}"
								onclick={() => (formState.color = colorKey as ServiceColor)}
								title={colorKey}
							>
								{#if formState.color === colorKey}
									<div class="absolute inset-0 flex items-center justify-center text-white">
										<Check size={16} strokeWidth={3} />
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div
					class="flex items-center gap-2 pt-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
				>
					<CalendarClock size={14} /> Configurações de Agenda
				</div>

				<!-- Antecedência Mínima -->
				<div class="grid gap-2">
					<Label class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase"
						>Antecedência Mínima (horas)</Label
					>
					<div class="relative">
						<Input
							name="min_notice_hours"
							type="text"
							placeholder="2"
							inputmode="numeric"
							bind:value={formState.min_notice_hours}
							class="h-12 rounded-xl font-bold"
							oninput={(e) => {
								formState.min_notice_hours = Number(e.currentTarget.value.replace(/\D/g, ''));
							}}
						/>
					</div>
				</div>
			</div>

			<!-- Rodapé com Botões Dinâmicos -->
			<div class="flex gap-3 border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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
						class="h-12 flex-1 rounded-2xl"
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
					class="h-12 {formState.id ? 'flex-[2]' : 'w-full'} rounded-2xl bg-zinc-900 text-white"
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 size-4 animate-spin" />
					{:else}
						{isConfirmingDelete ? 'Cancelar' : 'Salvar'}
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
