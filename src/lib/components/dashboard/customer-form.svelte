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
		onSuccess
	} = $props<{
		open: boolean;
		formData: any; // O form vindo do servidor
		onSuccess?: (newCustomer: any) => void;
	}>();

	const { form, errors, enhance, delayed } = superForm(formData, {
		validators: zod4Client(customerSchema),
		resetForm: true,
		invalidateAll: true,
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Cliente cadastrado!');
				open = false;
				// O 'result.data' do SvelteKit costuma conter o que o backend retorna
				onSuccess?.(form.data);
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Novo Cliente</Dialog.Title>
		</Dialog.Header>

		<form method="POST" action="/clientes?/upsert" class="grid gap-4 pt-4" use:enhance>
			<!-- Note o action apontando para a rota de clientes -->
			<div class="grid gap-2">
				<Label for="name">Nome completo</Label>
				<Input id="name" name="name" bind:value={$form.name} />
				{#if $errors.name}<small class="text-destructive">{$errors.name}</small>{/if}
			</div>

			<div class="grid gap-2">
				<Label for="phone">Telefone</Label>
				<Input id="phone" name="phone" bind:value={$form.phone} />
				{#if $errors.phone}<small class="text-destructive">{$errors.phone}</small>{/if}
			</div>

			<Dialog.Footer>
				<Button type="submit" disabled={$delayed}>
					{#if $delayed}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Salvar Cliente
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
