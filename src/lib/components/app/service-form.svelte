<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, CalendarClock, Coffee, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let {
		service = null,
		open = $bindable(),
		formData,
		initialName = '',
		onSuccess
	} = $props<{
		service?: any;
		open: boolean;
		formData?: any;
		initialName?: string;
		onSuccess?: (newService: any) => void;
	}>();

	let isLoading = $state(false);

	// Estado local do formulário usando Runes
	let formState = $state({
		id: '',
		name: '',
		duration: 30,
		min_notice_hours: 2,
		buffer_after_min: 0
	});

	let isConfirmingDelete = $state(false);
	$effect(() => {
		if (!open) {
			isConfirmingDelete = false;
		}
	});

	// Sincroniza o estado quando o modal abre ou o serviço muda
	$effect(() => {
		if (open) {
			if (service) {
				formState = {
					id: service.id ?? '',
					name: service.name ?? '',
					duration: service.duration ?? 30,
					min_notice_hours: service.min_notice_hours ?? 2,
					buffer_after_min: service.buffer_after_min ?? 0
				};
			} else {
				formState = {
					id: '',
					name: initialName || '',
					duration: 30,
					min_notice_hours: 2,
					buffer_after_min: 0
				};
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-100">
		<Dialog.Header class="shrink-0 border-b px-6 py-4">
			<Dialog.Title>{formState.id ? 'Editar Serviço' : 'Novo Serviço'}</Dialog.Title>
		</Dialog.Header>

		<form
			method="POST"
			action="/servicos?/upsert"
			use:enhance={() => {
				isLoading = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					isLoading = false;

					if (result.type === 'success') {
						// Agora o dado está exatamente onde a Action colocou: em result.data.service
						// @ts-ignore
						const newService = result.data?.service;

						if (newService) {
							onSuccess?.(newService);
						}
						open = false;
					} else if (result.type === 'failure') {
						// ... erro
					}
				};
			}}
			class="flex flex-1 flex-col overflow-hidden"
		>
			<input type="hidden" name="id" value={formState.id} />

			<div class="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
				<div class="grid gap-2">
					<Label for="name">Nome</Label>
					<Input
						id="name"
						name="name"
						bind:value={formState.name}
						placeholder="Ex: Corte de Cabelo"
						minlength={3}
						required
					/>
				</div>

				<div class="grid gap-2">
					<Label for="duration">Duração (minutos)</Label>
					<div class="relative">
						<Clock class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							id="duration"
							name="duration"
							type="number"
							inputmode="numeric"
							min={1}
							class="pl-9"
							bind:value={formState.duration}
							required
						/>
					</div>
				</div>

				<div class="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
					<CalendarClock class="h-4 w-4" /> Regras de Agendamento
				</div>

				<div class="grid gap-2">
					<Label for="min_notice_hours">Antecedência Mínima (horas)</Label>
					<Input
						id="min_notice_hours"
						name="min_notice_hours"
						inputmode="numeric"
						min={0}
						type="number"
						bind:value={formState.min_notice_hours}
					/>
				</div>

				<div class="grid gap-2">
					<Label for="buffer_after_min">Intervalo de Respiro (minutos)</Label>
					<div class="relative">
						<Coffee class="absolute top-2 left-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							id="buffer_after_min"
							name="buffer_after_min"
							type="number"
							inputmode="numeric"
							min={0}
							class="pl-9"
							bind:value={formState.buffer_after_min}
						/>
					</div>
				</div>
			</div>

			<div
				class="flex shrink-0 gap-3 border-t px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
			>
				{#if formState.id}
					{#if !isConfirmingDelete}
						<!-- Primeiro toque: Ativa o estado de confirmação -->
						<Button
							type="button"
							variant="outline"
							onclick={() => (isConfirmingDelete = true)}
							class="flex-1 cursor-pointer border-destructive/20 text-destructive sm:hidden"
						>
							<Trash2 class="mr-2 h-4 w-4" />
							Excluir
						</Button>
					{:else}
						<!-- Segundo toque: Executa a exclusão de fato -->
						<Button
							type="submit"
							variant="destructive"
							formaction="/servicos?/delete"
							disabled={isLoading}
							class="flex-1 animate-in cursor-pointer duration-200 zoom-in-95 fade-in sm:hidden"
						>
							{#if isLoading}
								<LoaderCircle class="h-4 w-4 animate-spin" />
							{:else}
								Confirmar?
							{/if}
						</Button>
					{/if}
				{/if}

				<Button
					type="submit"
					disabled={isLoading}
					class="cursor-pointer {formState.id ? 'flex-[2] sm:w-full' : 'w-full'}"
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Salvando
					{:else}
						{isConfirmingDelete ? 'Cancelar' : formState.id ? 'Salvar' : 'Salvar'}
					{/if}
					<!-- Se o usuário clicar em "Cancelar" (botão principal) enquanto estiver confirmando, voltamos o estado -->
					<button type="button" class="hidden" onclick={() => (isConfirmingDelete = false)}
					></button>
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
