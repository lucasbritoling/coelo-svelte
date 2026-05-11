<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, CalendarClock, Coffee, Trash2 } from '@lucide/svelte';
	import { enhance } from '$app/forms';

	// Definição de interface para melhor DX
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

	// --- Utilitários ---
	const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

	const handleOpenAutoFocus = (e: Event) => {
		if (formState.id && isMobile()) e.preventDefault();
	};

	const focusButton = (node: HTMLElement) => {
		node.querySelector('button')?.focus();
	};

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
		onOpenAutoFocus={handleOpenAutoFocus}
		class="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-[400px]"
	>
		<Dialog.Header class="shrink-0 border-b px-6 py-4">
			<Dialog.Title>{formState.id ? 'Editar Serviço' : 'Novo Serviço'}</Dialog.Title>
		</Dialog.Header>

		<form
			method="POST"
			action="/servicos?/upsert"
			use:enhance={() => {
				isLoading = true;
				return async ({ result, update }) => {
					// reset: false impede que os inputs limpem antes do modal fechar
					await update({ reset: false });
					isLoading = false;

					if (result.type === 'success') {
						// Tipagem segura sem @ts-ignore
						const data = result.data as { service?: Service };
						if (data?.service) onSuccess?.(data.service);
						open = false;
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

				<div class="mt-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
					<CalendarClock class="h-4 w-4" /> Regras de Agendamento
				</div>

				<div class="grid gap-2">
					<Label for="min_notice_hours">Antecedência Mínima (horas)</Label>
					<Input
						id="min_notice_hours"
						name="min_notice_hours"
						type="number"
						inputmode="numeric"
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
					<div use:focusButton class="flex-1 sm:hidden">
						{#if !isConfirmingDelete}
							<Button
								type="button"
								variant="outline"
								onclick={() => (isConfirmingDelete = true)}
								class="w-full cursor-pointer border-destructive/20 text-destructive"
							>
								<Trash2 class="mr-2 h-4 w-4" /> Excluir
							</Button>
						{:else}
							<Button
								type="submit"
								variant="destructive"
								formaction="/servicos?/delete"
								disabled={isLoading}
								class="w-full animate-in cursor-pointer zoom-in-95 fade-in"
							>
								{#if isLoading}
									<LoaderCircle class="h-4 w-4 animate-spin" />
								{:else}
									Confirmar?
								{/if}
							</Button>
						{/if}
					</div>
				{/if}

				<Button
					type={isConfirmingDelete ? 'button' : 'submit'}
					disabled={isLoading}
					onclick={(e) => {
						if (isConfirmingDelete) {
							e.preventDefault();
							isConfirmingDelete = false;
						}
					}}
					class="cursor-pointer {formState.id ? 'flex-[2] sm:w-full' : 'w-full'}"
				>
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						Salvando
					{:else}
						{isConfirmingDelete ? 'Cancelar' : 'Salvar'}
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
