<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldSeparator
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ActionData } from '../../routes/(auth)/login/$types';
	import { enhance } from '$app/forms';
	import { LoaderCircle } from '@lucide/svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		form?: ActionData;
	}

	let { form, class: className, ...restProps }: Props = $props();
	let isLoading = $state(false);

	const id = $props.id();
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root
		class="rounded-2xl border-[rgba(0,0,0,0.06)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_30px_-10px_rgba(0,0,0,0.04)]"
	>
		<Card.Header class="pb-5 text-center">
			<Card.Title class="text-xl font-semibold tracking-tight text-[#0a0a0a]"
				>Bem-vindo de volta</Card.Title
			>
			<Card.Description class="mt-1 text-xs text-[#737373]"
				>Acesse sua conta para gerenciar seus agendamentos</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
			>
				<FieldGroup class="space-y-4">
					<div class="grid grid-cols-1 gap-2">
						<Button
							variant="outline"
							type="button"
							class="h-10.5 gap-2 rounded-xl border-[#e5e5e5] text-sm font-medium text-[#262626] transition-all hover:bg-[#fafafa]"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								class="size-4 fill-current"
							>
								<path
									d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
								/>
							</svg>
							<span>Entrar com Apple</span>
						</Button>
						<Button
							variant="outline"
							type="button"
							class="h-10.5 gap-2 rounded-xl border-[#e5e5e5] text-sm font-medium text-[#262626] transition-all hover:bg-[#fafafa]"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								class="size-4 fill-current"
							>
								<path
									d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
								/>
							</svg>
							<span>Entrar com Google</span>
						</Button>
					</div>

					<FieldSeparator
						class="py-2 text-[11px] font-medium tracking-wider text-[#a3a3a3] uppercase *:data-[slot=field-separator-content]:bg-white"
					>
						Ou continue com
					</FieldSeparator>

					<Field class="space-y-1.5">
						<FieldLabel for="email-{id}" class="text-xs font-semibold tracking-tight text-[#262626]"
							>E-mail</FieldLabel
						>
						<Input
							id="email-{id}"
							type="email"
							name="email"
							value={form?.email ?? ''}
							placeholder="email@exemplo.com"
							class="h-10.5 rounded-xl border-[#e5e5e5] text-sm focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
							required
						/>
						{#if form?.errors?.email}
							<span class="text-[11px] font-medium text-destructive">{form.errors.email[0]}</span>
						{/if}
					</Field>

					<Field class="space-y-1.5">
						<div class="flex items-center justify-between">
							<FieldLabel
								for="password-{id}"
								class="text-xs font-semibold tracking-tight text-[#262626]">Senha</FieldLabel
							>
							<a
								href="/forgot"
								class="text-xs font-medium text-[#525252] underline-offset-4 hover:text-[#0a0a0a] hover:underline"
							>
								Esqueceu sua senha?
							</a>
						</div>
						<Input
							id="password-{id}"
							type="password"
							name="password"
							class="h-10.5 rounded-xl border-[#e5e5e5] text-sm focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
							required
						/>
						{#if form?.errors?.password}
							<span class="text-[11px] font-medium text-destructive">{form.errors.password[0]}</span
							>
						{/if}
					</Field>

					{#if form?.message}
						<div
							class="rounded-lg bg-destructive/5 p-3 text-center text-xs font-medium text-destructive"
						>
							{form.message}
						</div>
					{/if}

					<Field class="space-y-3 pt-2">
						<Button
							type="submit"
							class="h-10.5 w-full rounded-xl bg-[#0a0a0a] text-sm font-medium text-white transition-all hover:bg-[#262626]"
							disabled={isLoading}
						>
							{#if isLoading}
								<LoaderCircle class="mr-2 size-4 animate-spin" />
								Autenticando...
							{:else}
								Entrar
							{/if}
						</Button>
						<FieldDescription class="text-center text-xs text-[#737373]">
							Não possui uma conta? <a href="/signup" class="font-semibold text-[#0a0a0a] underline"
								>Inscreva-se</a
							>
						</FieldDescription>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>

	<FieldDescription class="px-4 text-center text-[11px] leading-relaxed text-[#a3a3a3]">
		Ao continuar, você concorda com os nossos <a
			href="/termos"
			class="underline hover:text-[#525252]">Termos de Serviço</a
		>
		e <a href="/privacidade" class="underline hover:text-[#525252]">Política de Privacidade</a>.
	</FieldDescription>
</div>
