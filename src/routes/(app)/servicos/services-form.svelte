<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Clock, LoaderCircle } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';

	// Props:
	// formData: o objeto 'form' que vem do superValidate no load
	// service: o objeto do serviço selecionado para edição (ou null para novo)
	// open: controle de visibilidade do modal (bindable)
	let { formData, service, open = $bindable() } = $props();
	let isLoading = $state(false);

	const { form, errors, enhance, delayed, constraints } = superForm(formData, {
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
				open = false;
				toast.success('Serviço guardado com sucesso!');
			}
		},
		onError: ({ result }) => {
			toast.error('Erro ao salvar serviço');
		}
	});

	/**
	 * Svelte 5 Effect: Sempre que o modal abrir ou o 'service' mudar,
	 * atualizamos os valores internos do Superform.
	 */
	$effect(() => {
		if (open) {
			if (service) {
				// Modo Edição: Popula com dados existentes
				$form.id = service.id;
				$form.name = service.name;
				$form.duration = service.duration;
				$form.price = service.price ?? 0;
			} else {
				// Modo Criação: Limpa os campos
				$form.id = '';
				$form.name = '';
				$form.duration = 30;
				$form.price = 0;
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[400px]">
		<Dialog.Header>
			<Dialog.Title>{$form.id ? 'Editar Serviço' : 'Novo Serviço'}</Dialog.Title>
		</Dialog.Header>

		<form method="POST" action="?/upsert" class="grid gap-4 py-4 pb-0" use:enhance>
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="grid gap-2">
				<Label for="name" class={$errors.name ? 'text-destructive' : ''}>Nome do serviço</Label>
				<Input
					id="name"
					name="name"
					bind:value={$form.name}
					placeholder="Ex: Corte de Cabelo"
					{...$constraints.name}
					aria-invalid={$errors.name ? 'true' : undefined}
				/>
				{#if $errors.name}
					<span class="text-xs font-medium text-destructive">{$errors.name}</span>
				{/if}
			</div>

			<div class="grid gap-2">
				<Label for="duration" class={$errors.duration ? 'text-destructive' : ''}>
					Duração (minutos)
				</Label>
				<div class="relative">
					<Clock class="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						id="duration"
						name="duration"
						type="number"
						class="pl-9"
						bind:value={$form.duration}
						{...$constraints.duration}
					/>
				</div>
				{#if $errors.duration}
					<span class="text-xs font-medium text-destructive">{$errors.duration}</span>
				{/if}
			</div>

			<div class="grid gap-2">
				<Label for="price" class={$errors.price ? 'text-destructive' : ''}>Preço (R$)</Label>
				<Input
					id="price"
					name="price"
					type="number"
					step="0.01"
					bind:value={$form.price}
					{...$constraints.price}
				/>
				{#if $errors.price}
					<span class="text-xs font-medium text-destructive">{$errors.price}</span>
				{/if}
			</div>

			<Dialog.Footer>
				<Button type="submit" disabled={isLoading} class="cursor-pointer">
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						Salvando...
					{:else}
						{$form.id ? 'Salvar Alterações' : 'Criar Serviço'}
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
