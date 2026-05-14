<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, CalendarClock, Coffee, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	interface Service {
		id?: string;
		name: string;
		duration: number;
		min_notice_hours: number;
		buffer_after_min: number;
	}

	let {
		service = null,
		open = $bindable(),
		initialName = '',
		onSuccess
	} = $props<{
		service?: Service | null;
		open: boolean;
		initialName?: string;
		onSuccess?: (newService: Service) => void;
	}>();

	let isLoading = $state(false);
	let isConfirmingDelete = $state(false);

	let formState = $state<Service>({
		id: '',
		name: '',
		duration: 30,
		min_notice_hours: 2,
		buffer_after_min: 0
	});

	// --- Efeitos ---
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
				buffer_after_min: service?.buffer_after_min ?? 0
			};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[32px] p-0 sm:max-w-[400px]"
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

			<div class="space-y-6 px-6 pb-8">
				<!-- Nome -->
				<div class="grid gap-2">
					<Label class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">Nome</Label>
					<Input
						name="name"
						bind:value={formState.name}
						placeholder="Ex: Corte de Cabelo"
						class="h-12 rounded-xl"
						required
					/>
				</div>

				<!-- Duração -->
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
								// Remove tudo que não for de 0 a 9 em tempo real
								formState.duration = e.currentTarget.value.replace(/\D/g, '');
							}}
						/>
					</div>
				</div>

				<div
					class="flex items-center gap-2 pt-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
				>
					<CalendarClock size={14} /> Configurações de Agenda
				</div>

				<div class="grid grid-cols-2 gap-4">
					<!-- Antecedência -->
					<div class="grid gap-2">
						<Label class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase"
							>Antecedência (horas)</Label
						>
						<div class="relative">
							<Input
								name="min_notice_hours"
								type="text"
								placeholder="2"
								inputmode="numeric"
								bind:value={formState.min_notice_hours}
								class="h-12 rounded-xl  font-bold"
								oninput={(e) => {
									// Remove tudo que não for de 0 a 9 em tempo real
									formState.min_notice_hours = e.currentTarget.value.replace(/\D/g, '');
								}}
							/>
						</div>
					</div>

					<!-- Buffer -->
					<div class="grid gap-2">
						<Label class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase"
							>Intervalo (minutos)</Label
						>
						<div class="relative">
							<Coffee class="absolute top-4 left-4 size-4 text-zinc-400" />
							<Input
								name="buffer_after_min"
								type="text"
								placeholder="0"
								inputmode="numeric"
								bind:value={formState.buffer_after_min}
								class="h-12 rounded-xl pl-11 font-bold"
								oninput={(e) => {
									// Remove tudo que não for de 0 a 9 em tempo real
									formState.buffer_after_min = e.currentTarget.value.replace(/\D/g, '');
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer com Botões unificados -->
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
					type="submit"
					disabled={isLoading}
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
	/* Remove as setinhas padrão do input number para manter o visual limpo */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
