<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { LoaderCircle } from '@lucide/svelte';

	import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { forgotPasswordSchema } from '$lib/schemas/auth';

	// Svelte 5: Definindo as props com interface para melhor tipagem
	interface Props {
		data: SuperValidated<Infer<typeof forgotPasswordSchema>>;
	}

	let { data }: Props = $props();

	// Inicialização com zod4Client
	const { form, errors, enhance, message, delayed } = superForm(data, {
		validators: zod4Client(forgotPasswordSchema),
		resetForm: true // Limpa o campo após o sucesso, se desejar
	});
</script>

<div class="flex flex-col gap-6">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-center text-xl">Recuperar Senha</Card.Title>
			<Card.Description class="text-center">
				Enviaremos um link para o seu e-mail para redefinir sua senha.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				{#if $message}
					<div
						class={cn(
							'mb-4 text-center text-sm font-medium',
							$errors.email ? 'text-destructive' : 'text-primary'
						)}
					>
						{$message}
					</div>
				{/if}

				<div class="grid gap-4">
					<Field.Field>
						<Field.Label for="email">E-mail</Field.Label>
						<Input
							name="email"
							id="email"
							type="email"
							placeholder="email@exemplo.com"
							bind:value={$form.email}
						/>
						{#if $errors.email}
							<span class="text-xs text-destructive">{$errors.email}</span>
						{/if}
					</Field.Field>

					<Button type="submit" class="w-full" disabled={$delayed}>
						{#if $delayed}
							<LoaderCircle class="mr-2 size-4 animate-spin" />
							Enviando...
						{:else}
							Enviar link de recuperação
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
