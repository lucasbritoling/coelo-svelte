<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle, CalendarClock, Coffee } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let {
		service = null,
		open = $bindable(),
		initialName = '',
		onSuccess
	} = $props<{
		service?: any;
		open: boolean;
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
					// O 'update' aplica o comportamento padrão do SvelteKit (resetar se necessário)
					await update({ reset: false });
					isLoading = false;

					if (result.type === 'success') {
						toast.success('Serviço salvo!');
						// @ts-ignore - os dados retornados pela sua action
						onSuccess?.(result.data); 
						open = false; // FECHA O MODAL IMEDIATAMENTE
					} else if (result.type === 'failure') {
						// @ts-ignore
						toast.error(result.data?.message || 'Erro ao salvar serviço');
					}
				};
			}}
			class="flex flex-1 flex-col overflow-hidden"
		>
			<input type="hidden" name="id" value={formState.id} />

			<div class="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
				<div class="grid gap-2">
					<Label for="name">Nome do serviço</Label>
					<Input
						id="name"
						name="name"
						bind:value={formState.name}
						placeholder="Ex: Corte de Cabelo"
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
							class="pl-9"
							bind:value={formState.buffer_after_min}
						/>
					</div>
				</div>
			</div>

			<div class="shrink-0 border-t px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
				<Button type="submit" disabled={isLoading} class="w-full cursor-pointer">
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Salvando...
					{:else}
						{formState.id ? 'Salvar Alterações' : 'Criar Serviço'}
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>