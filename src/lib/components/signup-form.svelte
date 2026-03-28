<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Create your account</Card.Title>
			<Card.Description>Enter your email below to create your account</Card.Description>
		</Card.Header>
		<Card.Content>
			<form>
				<Field.Group>
					<Field.Field>
						<Field.Label for="name">Full Name</Field.Label>
						<Input id="name" type="text" placeholder="John Doe" required />
					</Field.Field>
					<Field.Field>
						<Field.Label for="email">Email</Field.Label>
						<Input id="email" type="email" placeholder="email@exemplo.com" required />
					</Field.Field>
					<Field.Field>
						<Field.Field class="grid grid-cols-2 gap-4">
							<Field.Field>
								<Field.Label for="password">Senha</Field.Label>
								<Input id="password" type="password" required />
							</Field.Field>
							<Field.Field>
								<Field.Label for="confirm-password">Confirmar Senha</Field.Label>
								<Input id="confirm-password" type="password" required />
							</Field.Field>
						</Field.Field>
						<Field.Description>Pelo menos 6 caracteres.</Field.Description>
					</Field.Field>
					<Field.Field>
						<Button type="submit">Criar conta</Button>
						<Field.Description class="text-center">
							Possui uma conta? <a href="#/">Entrar</a>
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
