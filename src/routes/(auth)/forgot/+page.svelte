<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { LoaderCircle, Mail, KeyRound, ArrowLeft } from '@lucide/svelte';

	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { forgotPasswordSchema } from '$lib/schemas/auth';
	import type { PageData } from './$types';

	// Svelte 5: Recebendo os dados diretamente do loader da página
	let { data }: { data: PageData } = $props();

	// Inicialização do Superforms usando o data.form vindo do loader
	const { form, errors, enhance, message, delayed } = superForm(data.form, {
		validators: zod4Client(forgotPasswordSchema),
		resetForm: true
	});
</script>

<div class="flex min-h-[80vh] w-full items-center justify-center p-4">
	<div class="flex w-full max-w-md flex-col gap-6">
		<Card.Root class="border-none shadow-lg sm:border sm:shadow-sm">
			<Card.Header class="space-y-3 pt-8 text-center">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<KeyRound class="size-6 text-primary" />
				</div>

				<div class="space-y-1">
					<Card.Title class="text-2xl font-semibold tracking-tight">Recuperar senha</Card.Title>
					<Card.Description class="text-balance text-muted-foreground">
						Insira seu e-mail e enviaremos um link para você criar uma nova senha.
					</Card.Description>
				</div>
			</Card.Header>

			<Card.Content>
				<form method="POST" use:enhance>
					{#if $message}
						<div
							class={cn(
								'mb-6 rounded-lg border p-3 text-center text-sm font-medium transition-all',
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
								<Mail
									class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
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
</div>
