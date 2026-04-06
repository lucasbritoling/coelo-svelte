<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { LoaderCircle, Mail, KeyRound, ArrowLeft } from '@lucide/svelte';

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

<div class="flex w-full max-w-2xl min-w-0! flex-col items-center justify-center gap-6">
	<Card.Root class="border-none shadow-lg sm:border sm:shadow-sm">
		<Card.Header class="space-y-3 pt-8 text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
				<KeyRound class="size-6 text-primary" />
			</div>

			<div class="space-y-1">
				<Card.Title class="text-2xl font-semibold tracking-tight">Recuperar senha</Card.Title>
				<Card.Description class="text-balance">
					Insira seu e-mail e enviaremos um link para você criar uma nova senha.
				</Card.Description>
			</div>
		</Card.Header>

		<Card.Content>
			<form method="POST" use:enhance>
				{#if $message}
					<div
						class={cn(
							'mb-6 rounded-lg border p-3 text-center text-sm font-medium',
							$errors.email
								? 'border-destructive/20 bg-destructive/10 text-destructive'
								: 'border-primary/20 bg-primary/10 text-primary'
						)}
					>
						{$message}
					</div>
				{/if}

				<div class="grid gap-4">
					<Field.Field class="space-y-2">
						<Field.Label for="email">E-mail</Field.Label>
						<div class="relative">
							<Mail class="absolute top-3 left-3 size-4 text-muted-foreground" />
							<Input
								name="email"
								id="email"
								type="email"
								placeholder="exemplo@email.com"
								class="pl-10"
								bind:value={$form.email}
							/>
						</div>
						{#if $errors.email}
							<p class="text-xs font-medium text-destructive">{$errors.email}</p>
						{/if}
					</Field.Field>

					<Button type="submit" class="w-full" disabled={$delayed}>
						{#if $delayed}
							<LoaderCircle class="mr-2 size-4 animate-spin" />
							Enviando link...
						{:else}
							Enviar link de recuperação
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>

		<Card.Footer class="flex justify-center pb-8">
			<a
				href="/login"
				class="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
			>
				<ArrowLeft class="size-3" />
				Voltar para o login
			</a>
		</Card.Footer>
	</Card.Root>
</div>
