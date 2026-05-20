<!-- $lib/components/app/CustomerForm.svelte -->
<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { LoaderCircle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { customerSchema } from '$lib/schemas/app';

	let {
		open = $bindable(false),
		formData,
		initialName = '',
		onSuccess
	} = $props<{
		open: boolean;
		formData: any; // O form vindo do servidor
		initialName?: string;
		onSuccess?: (newCustomer: any) => void;
	}>();

	let isLoading = $state(false);

	const { form, errors, enhance, message } = superForm(formData, {
		validators: zod4Client(customerSchema),
		resetForm: true,
		invalidateAll: true,

		// Dispara no milissegundo que o form é enviado
		onSubmit: () => {
			isLoading = true;
		},

		// Dispara assim que o servidor responde (sucesso ou erro)
		onResult: () => {
			isLoading = false;
		},

		onUpdated: ({ form }) => {
			if (form.valid) {
				// Tenta pegar o ID que veio do banco (via message)
				// ou usa o data caso seja uma edição (onde o ID já existia)
				const resultData = form.message?.id ? form.message : form.data;

				toast.success('Ok');

				// Passe o resultData, que tem mais chances de conter o ID novo
				onSuccess?.(resultData);
				open = false;
			} else if (typeof $message === 'string') {
				toast.error($message);
			}
		}
	});

	// Limpa o formulário sempre que o modal for fechado
	$effect(() => {
		if (!open) {
			$form.name = '';
			$form.phone = '';
			$form.id = undefined; // ou '' se preferir
		}
	});

	// Auto-preenchimento ao abrir o modal
	$effect(() => {
		if (open && initialName && !$form.name && !$form.id) {
			$form.name = initialName;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{$form.id ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
		</Dialog.Header>

		<form method="POST" action="/clientes?/upsert" class="grid gap-4 pt-4" use:enhance>
			{#if $form.id}
				<input type="hidden" name="id" bind:value={$form.id} />
			{/if}

			<div class="grid gap-2">
				<Label for="name">Nome</Label>
				<Input
					id="name"
					name="name"
					bind:value={$form.name}
					maxlength={100}
					oninput={(e) => {
						let val = e.currentTarget.value;

						// 1. Impede espaços no início
						val = val.replace(/^\s+/, '');
						// 2. Impede espaços duplos
						val = val.replace(/\s{2,}/g, ' ');
						// 3. Mantém letras, espaços, acentos pt-BR e acentos isolados (~^´`)
						val = val.replace(/[^a-zA-ZÀ-ÿ\s~^´`]/g, '');

						$form.name = val;
						e.currentTarget.value = val;
					}}
					onblur={() => {
						// Limpa acentos isolados e espaços extras ao sair do campo
						$form.name = $form.name.replace(/[~^´`]/g, '').trim();
					}}
				/>
				{#if $errors.name}<small class="text-destructive">{$errors.name}</small>{/if}
			</div>

			<div class="grid gap-2">
				<Label for="phone">Telefone (com DDD)</Label>
				<Input
					id="phone"
					name="phone"
					bind:value={$form.phone}
					inputmode="numeric"
					placeholder="11 99999-9999"
					pattern="[0-9]+"
					minlength={11}
					maxlength={11}
					oninput={(e) => {
						$form.phone = e.currentTarget.value.replace(/\D/g, '');
					}}
				/>
				{#if $errors.phone}<small class="text-destructive">{$errors.phone}</small>{/if}
			</div>

			<Dialog.Footer>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						Salvando
					{:else}
						Salvar
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
