<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { LoaderCircle } from '@lucide/svelte';

	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { resetPasswordSchema } from '$lib/schemas/auth';

	// Svelte 5: Recebe as props da página
	let { data } = $props();

	// CORREÇÃO: Passe data.form (o objeto SuperValidated) e não o data inteiro
	const { form, errors, enhance, message, delayed } = superForm(data.form, {
		validators: zod4Client(resetPasswordSchema),
		dataType: 'json' // Essencial para evitar o erro de "Object found" com .refine
	});
</script>

<div class="flex min-h-svh flex-col items-center justify-center p-6">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-center text-xl">Nova Senha</Card.Title>
			<Card.Description class="text-center">
				Digite sua nova senha de acesso abaixo.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				{#if $message}
					<div class="mb-4 text-center text-sm font-medium text-destructive">
						{$message}
					</div>
				{/if}

				<div class="grid gap-4">
					<Field.Field>
						<Field.Label for="password">Nova Senha</Field.Label>
						<Input name="password" id="password" type="password" bind:value={$form.password} />
						{#if $errors.password}
							<span class="text-xs text-destructive">{$errors.password}</span>
						{/if}
					</Field.Field>

					<Field.Field>
						<Field.Label for="confirmPassword">Confirmar Nova Senha</Field.Label>
						<Input
							name="confirmPassword"
							id="confirmPassword"
							type="password"
							bind:value={$form.confirmPassword}
						/>
						{#if $errors.confirmPassword}
							<span class="text-xs text-destructive">{$errors.confirmPassword}</span>
						{/if}
					</Field.Field>

					<Button type="submit" class="w-full" disabled={$delayed}>
						{#if $delayed}
							<LoaderCircle class="mr-2 size-4 animate-spin" />
							Atualizando...
						{:else}
							Redefinir Senha
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
