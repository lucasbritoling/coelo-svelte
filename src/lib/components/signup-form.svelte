<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { LoaderCircle } from '@lucide/svelte';

	import { superForm } from 'sveltekit-superforms';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import { signupSchema } from '$lib/schemas/auth';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		data: SuperValidated<Infer<typeof signupSchema>>;
	}

	// Svelte 5: Usando snippets/props desestruturados
	let { class: className, data, ...restProps }: Props = $props();

	let isLoading = $state(false);

	// Inicialização do Superforms v2 (totalmente compatível com Runes)
	const { form, errors, enhance, message } = superForm(data, {
		validators: zod4Client(signupSchema),
		resetForm: false,

		onSubmit: () => {
			isLoading = true;
		},

		onUpdated: () => {
			isLoading = false;
		}
	});
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Crie sua conta</Card.Title>
			<Card.Description>Insira seu e-mail abaixo para criar sua conta</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance>
				{#if $message}
					<div class="mb-4 text-center text-sm font-medium text-destructive">
						{$message}
					</div>
				{/if}

				<Field.Group>
					<Field.Field>
						<Field.Label for="full_name">Nome Completo</Field.Label>
						<Input name="full_name" bind:value={$form.full_name} placeholder="Maria Oliveira" />
						{#if $errors.full_name}<span class="text-xs text-destructive">{$errors.full_name}</span
							>{/if}
					</Field.Field>

					<Field.Field>
						<Field.Label for="username">Endereço da sua agenda</Field.Label>
						<div class="relative">
							<span class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
								coelo.dev/
							</span>
							<Input
								name="username"
								bind:value={$form.username}
								class="pl-19.5"
								placeholder="seu-nome"
							/>
						</div>
						<Field.Description>Seus clientes agendam por aqui.</Field.Description>
						{#if $errors.username}
							<span class="text-xs text-destructive">{$errors.username}</span>
						{/if}
					</Field.Field>
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

					<div class="grid grid-cols-2 gap-4">
						<Field.Field>
							<Field.Label for="password">Senha</Field.Label>
							<Input name="password" id="password" type="password" bind:value={$form.password} />
						</Field.Field>
						<Field.Field>
							<Field.Label for="confirmPassword">Confirmar Senha</Field.Label>
							<Input
								name="confirmPassword"
								id="confirmPassword"
								type="password"
								bind:value={$form.confirmPassword}
							/>
						</Field.Field>
					</div>

					{#if $errors.password || $errors.confirmPassword}
						<p class="text-xs text-destructive">
							{$errors.password || $errors.confirmPassword}
						</p>
					{/if}

					<Field.Field>
						<Button type="submit" class="w-full" disabled={isLoading}>
							{#if isLoading}
								<LoaderCircle class="mr-2 size-4 animate-spin" />
								Criando conta...
							{:else}
								Criar conta
							{/if}
						</Button>
						<Field.Description class="text-center">
							Possui uma conta? <a href="/login" class="underline">Entrar</a>
						</Field.Description>
					</Field.Field>
				</Field.Group>
			</form>
		</Card.Content>
	</Card.Root>
	<Field.Description class="px-6 text-center">
		Ao continuar, você concorda com os nossos <a href="#/">Termos de Serviço</a>
		e <a href="#/">Política de Privacidade</a>.
	</Field.Description>
</div>
