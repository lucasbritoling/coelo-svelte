<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import { Clock, Coffee, LoaderCircle } from '@lucide/svelte';

	let {
		formData,
		service = null,
		open = $bindable(),
		initialName = '',
		onSuccess
	} = $props<{
		formData: any;
		service?: any;
		open: boolean;
		initialName?: string;
		onSuccess?: (newService: any) => void;
	}>();

	let isLoading = $state(false);

	const { form, errors, enhance, constraints, message } = superForm(formData, {
		resetForm: true,
		invalidateAll: true,
		onSubmit: () => {
			isLoading = true;
		},
		onResult: () => {
			isLoading = false;
		},
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Ok');
				onSuccess?.(form.message?.id ? form.message : form.data);
				open = false;
			} else if (typeof $message === 'string') {
				toast.error($message);
			}
		},
		onError: () => toast.error('Erro ao salvar serviço')
	});

	$effect(() => {
		if (open) {
			if (service) {
				$form.id = service.id;
				$form.name = service.name;
				$form.duration = service.duration;
				$form.min_notice_hours = service.min_notice_hours ?? 2;
				$form.buffer_after_min = service.buffer_after_min ?? 0;
			} else {
				$form.id = '';
				$form.name = initialName || '';
				$form.duration = 30;
				$form.min_notice_hours = 2;
				$form.buffer_after_min = 0;
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-[400px]">
		<Dialog.Header class="border-b px-5 py-4">
			<Dialog.Title class="text-base font-semibold">
				{$form.id ? 'Editar serviço' : 'Novo serviço'}
			</Dialog.Title>
		</Dialog.Header>

		<form method="POST" action="/servicos?/upsert" class="flex flex-col" use:enhance>
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="flex flex-col gap-4 px-5 py-4">
				<!-- Nome -->
				<div class="grid gap-1.5">
					<Label for="d-name" class={$errors.name ? 'text-destructive' : ''}>Nome do serviço</Label>
					<Input
						id="d-name"
						name="name"
						bind:value={$form.name}
						placeholder="Ex: Corte de Cabelo"
						autocomplete="off"
						{...$constraints.name}
					/>
					{#if $errors.name}
						<span class="text-xs text-destructive">{$errors.name}</span>
					{/if}
				</div>

				<!-- Duração -->
				<div class="grid gap-1.5">
					<Label for="d-duration">Duração (min)</Label>
					<div class="relative">
						<Clock
							class="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="d-duration"
							name="duration"
							type="number"
							class="pl-8"
							bind:value={$form.duration}
							{...$constraints.duration}
						/>
					</div>
				</div>

				<!-- Divisor com label -->
				<div class="flex items-center gap-2">
					<div class="h-px flex-1 bg-border"></div>
					<span class="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
						Regras
					</span>
					<div class="h-px flex-1 bg-border"></div>
				</div>

				<!-- Antecedência + Buffer lado a lado -->
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-1.5">
						<Label for="d-notice" class="text-xs">Antecedência mín. (h)</Label>
						<Input
							id="d-notice"
							name="min_notice_hours"
							type="number"
							class="h-9 text-sm"
							bind:value={$form.min_notice_hours}
						/>
						<p class="text-[10px] leading-tight text-muted-foreground italic">
							Evita agendamentos de última hora.
						</p>
					</div>

					<div class="grid gap-1.5">
						<Label for="d-buffer" class="text-xs">Respiro após (min)</Label>
						<div class="relative">
							<Coffee
								class="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id="d-buffer"
								name="buffer_after_min"
								type="number"
								class="h-9 pl-8 text-sm"
								bind:value={$form.buffer_after_min}
							/>
						</div>
						<p class="text-[10px] leading-tight text-muted-foreground italic">
							Pausa após o serviço.
						</p>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t px-5 py-3">
				<Button type="submit" class="w-full" disabled={isLoading}>
					{#if isLoading}
						<LoaderCircle class="mr-2 h-3.5 w-3.5 animate-spin" />
						Salvando...
					{:else}
						{$form.id ? 'Salvar alterações' : 'Criar serviço'}
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
