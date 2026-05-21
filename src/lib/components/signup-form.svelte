<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { fade, fly } from 'svelte/transition';
	import {
		LoaderCircle,
		ArrowRight,
		ArrowLeft,
		Check,
		Clock,
		MapPin,
		Calendar
	} from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { signupSchema } from '$lib/schemas/auth';

	let { class: className, data, ...restProps } = $props();

	// Controle de Passos (Onboarding Steps)
	let currentStep = $state(1);
	let isLoading = $state(false);

	const colorPalettes = [
		{ hex: '#0a0a0a', name: 'Neutral Dark' },
		{ hex: '#6366f1', name: 'Indigo Aura' },
		{ hex: '#10b981', name: 'Emerald Mint' },
		{ hex: '#f59e0b', name: 'Amber Gold' },
		{ hex: '#ef4444', name: 'Rose Crisp' }
	];

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

	// Runa para limpar o preview da URL em tempo real exatamente como o Zod fará no backend
	const cleanedUsernamePreview = $derived(
		($form.username || '')
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[æ]/g, 'ae')
			.replace(/[œ]/g, 'oe')
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
	);

	// Atualize suas validações para olhar para $form diretamente
	const isStep1Valid = $derived(
		cleanedUsernamePreview.length >= 3 && cleanedUsernamePreview.length <= 30
	);
	const isStep2Valid = $derived($form.first_service_name.trim().length > 2); // Usa o form

	function nextStep() {
		if (currentStep < 3) currentStep += 1;
	}

	function prevStep() {
		if (currentStep > 1) currentStep -= 1;
	}
</script>

<div class={cn('grid grid-cols-1 items-start gap-8 lg:grid-cols-12', className)} {...restProps}>
	<div class="order-2 w-full lg:order-1 lg:col-span-5">
		<Card.Root
			class="border-rgba(0,0,0,0.06) rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_30px_-10px_rgba(0,0,0,0.04)]"
		>
			<Card.Header class="pb-5">
				<div class="mb-4 flex items-center gap-1.5">
					{#each [1, 2, 3] as step}
						<div
							class="h-1 flex-1 rounded-full transition-all duration-300"
							class:bg-[#0a0a0a]={currentStep >= step}
							class:bg-[#e5e5e5]={currentStep < step}
						></div>
					{/each}
				</div>

				{#if currentStep === 1}
					<div in:fade={{ duration: 150 }}>
						<Card.Title class="text-xl font-semibold tracking-tight text-[#0a0a0a]"
							>Configure seu link</Card.Title
						>
						<Card.Description class="mt-1 text-xs text-[#737373]"
							>Defina como seus clientes encontrarão sua agenda na web.</Card.Description
						>
					</div>
				{:else if currentStep === 2}
					<div in:fade={{ duration: 150 }}>
						<Card.Title class="text-xl font-semibold tracking-tight text-[#0a0a0a]"
							>Seu primeiro serviço</Card.Title
						>
						<Card.Description class="mt-1 text-xs text-[#737373]"
							>Crie um serviço de demonstração para ativar seus primeiros horários.</Card.Description
						>
					</div>
				{:else}
					<div in:fade={{ duration: 150 }}>
						<Card.Title class="text-xl font-semibold tracking-tight text-[#0a0a0a]"
							>Para finalizar, quem é você?</Card.Title
						>
						<Card.Description class="mt-1 text-xs text-[#737373]"
							>Crie suas credenciais seguras para acessar seu painel.</Card.Description
						>
					</div>
				{/if}
			</Card.Header>

			<Card.Content>
				<form method="POST" use:enhance class="space-y-5">
					{#if $message}
						<div
							class="rounded-lg bg-destructive/5 p-3 text-center text-xs font-medium text-destructive"
						>
							{$message}
						</div>
					{/if}

					{#if currentStep === 1}
						<div class="space-y-4" in:fly={{ x: -10, duration: 250 }}>
							<Field.Field class="space-y-1.5">
								<Field.Label
									class="text-xs font-semibold tracking-tight text-[#262626]"
									for="username">Endereço da agenda</Field.Label
								>
								<div class="relative flex items-center">
									<span class="absolute left-3.5 text-sm font-medium text-[#a3a3a3] select-none"
										>coelo.dev/</span
									>
									<Input
										name="username"
										bind:value={$form.username}
										class="h-10.5 rounded-xl border-[#e5e5e5] bg-[#fafafa] pl-[82px] text-sm focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
										placeholder="seu-nome"
										autocomplete="off"
									/>
								</div>
								{#if $errors.username}
									<span class="text-xs font-medium text-destructive">{$errors.username}</span>
								{/if}
							</Field.Field>

							<Field.Field class="space-y-1.5">
								<Field.Label
									class="text-xs font-semibold tracking-tight text-[#262626]"
									for="address"
									>Local de atendimento <span class="font-normal text-[#a3a3a3]">(Opcional)</span
									></Field.Label
								>
								<Input
									id="address"
									bind:value={$form.address_custom}
									class="h-10.5 rounded-xl border-[#e5e5e5] text-sm focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
									placeholder="Ex: São Paulo, SP ou Atendimento Online"
								/>
							</Field.Field>
						</div>
					{/if}

					{#if currentStep === 2}
						<div class="space-y-4" in:fly={{ x: 10, duration: 250 }}>
							<Field.Field class="space-y-1.5">
								<Field.Label class="text-xs font-semibold tracking-tight text-[#262626]"
									>Nome do Serviço</Field.Label
								>
								<Input
									bind:value={$form.first_service_name}
									class="h-10.5 rounded-xl border-[#e5e5e5] text-sm focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
									placeholder="Ex: Atendimento Presencial, Mentoria..."
								/>
							</Field.Field>

							<div class="grid grid-cols-2 gap-3">
								<Field.Field class="space-y-1.5">
									<Field.Label class="text-xs font-semibold tracking-tight text-[#262626]"
										>Duração</Field.Label
									>
									<select
										bind:value={$form.first_service_duration}
										class="h-10.5 w-full rounded-xl border border-[#e5e5e5] bg-white px-3 text-sm transition-all focus:ring-1 focus:ring-[#0a0a0a] focus:outline-none"
									>
										<option value="30">30 minutos</option>
										<option value="45">45 minutos</option>
										<option value="60">1 hora</option>
										<option value="90">1h 30min</option>
									</select>
								</Field.Field>

								<Field.Field class="space-y-1.5">
									<Field.Label class="text-xs font-semibold tracking-tight text-[#262626]"
										>Identidade Visual</Field.Label
									>
									<div
										class="flex h-10.5 items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-1.5"
									>
										{#each colorPalettes as palette}
											<button
												type="button"
												onclick={() => ($form.first_service_color = palette.hex)}
												class="relative flex size-6.5 items-center justify-center rounded-full transition-transform duration-150 focus:outline-none"
												style="background-color: {palette.hex};"
												class:scale-110={$form.first_service_color === palette.hex}
											>
												{#if $form.first_service_color === palette.hex}
													<Check size={11} strokeWidth={3} class="text-white" />
												{/if}
											</button>
										{/each}
									</div>
								</Field.Field>
							</div>
						</div>
					{/if}

					{#if currentStep === 3}
						<div class="space-y-3" in:fly={{ x: 10, duration: 250 }}>
							<Field.Field class="space-y-1">
								<Field.Label class="text-xs font-semibold text-[#262626]" for="full_name"
									>Nome completo</Field.Label
								>
								<Input
									name="full_name"
									bind:value={$form.full_name}
									class="h-10 rounded-xl border-[#e5e5e5] text-sm"
									placeholder="Maria Oliveira"
								/>
								{#if $errors.full_name}<span class="text-[11px] font-medium text-destructive"
										>{$errors.full_name}</span
									>{/if}
							</Field.Field>

							<Field.Field class="space-y-1">
								<Field.Label class="text-xs font-semibold text-[#262626]" for="email"
									>E-mail corporativo</Field.Label
								>
								<Input
									name="email"
									id="email"
									type="email"
									class="h-10 rounded-xl border-[#e5e5e5] text-sm"
									placeholder="voce@empresa.com"
									bind:value={$form.email}
								/>
								{#if $errors.email}<span class="text-[11px] font-medium text-destructive"
										>{$errors.email}</span
									>{/if}
							</Field.Field>

							<div class="grid grid-cols-2 gap-2.5">
								<Field.Field class="space-y-1">
									<Field.Label class="text-xs font-semibold text-[#262626]" for="password"
										>Senha</Field.Label
									>
									<Input
										name="password"
										id="password"
										type="password"
										class="h-10 rounded-xl border-[#e5e5e5] text-sm"
										bind:value={$form.password}
									/>
								</Field.Field>
								<Field.Field class="space-y-1">
									<Field.Label class="text-xs font-semibold text-[#262626]" for="confirmPassword"
										>Confirmar</Field.Label
									>
									<Input
										name="confirmPassword"
										id="confirmPassword"
										type="password"
										class="h-10 rounded-xl border-[#e5e5e5] text-sm"
										bind:value={$form.confirmPassword}
									/>
								</Field.Field>
							</div>
							{#if $errors.password || $errors.confirmPassword}
								<p class="text-[11px] font-medium text-destructive">
									{$errors.password || $errors.confirmPassword}
								</p>
							{/if}
						</div>
					{/if}

					<div class="flex items-center gap-2 pt-2">
						{#if currentStep > 1}
							<Button
								type="button"
								variant="outline"
								onclick={prevStep}
								class="h-10.5 rounded-xl border-[#e5e5e5] px-4 text-[#525252]"
							>
								<ArrowLeft size={14} class="mr-1" />
							</Button>
						{/if}

						{#if currentStep < 3}
							<Button
								type="button"
								class="h-10.5 flex-1 rounded-xl bg-[#0a0a0a] text-sm font-medium text-white transition-all hover:bg-[#262626]"
								disabled={(currentStep === 1 && !isStep1Valid) ||
									(currentStep === 2 && !isStep2Valid)}
								onclick={nextStep}
							>
								<span>Continuar</span>
								<ArrowRight size={14} class="ml-1.5" />
							</Button>
						{:else}
							<Button
								type="submit"
								class="h-10.5 flex-1 rounded-xl bg-[#0a0a0a] text-sm font-medium text-white transition-all hover:bg-[#262626]"
								disabled={isLoading}
							>
								{#if isLoading}
									<LoaderCircle class="mr-2 size-4 animate-spin" />
									Ativando seu espaço...
								{:else}
									Concluir e Criar Agenda
								{/if}
							</Button>
						{/if}
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<p class="mt-4 px-2 text-center text-[11px] leading-relaxed text-[#a3a3a3]">
			Ao continuar, você concorda com os nossos <a
				href="/termos"
				class="underline hover:text-[#525252]">Termos de Serviço</a
			>
			e <a href="/privacidade" class="underline hover:text-[#525252]">Política de Privacidade</a>.
		</p>
	</div>

	<div class="order-1 hidden w-full sm:block lg:order-2 lg:col-span-7">
		<div
			class="sticky top-10 flex min-h-[440px] flex-col gap-5 rounded-2xl border border-dashed border-[#e5e5e5] bg-[#fcfcfc] p-6"
		>
			<div class="flex items-center justify-between border-b border-[#f0f0f0] pb-4">
				<div class="flex items-center gap-2.5">
					<div
						class="flex size-8 items-center justify-center rounded-full bg-[#e5e5e5] text-xs font-bold text-[#525252]"
					>
						{($form.full_name ? $form.full_name.charAt(0) : 'C').toUpperCase()}
					</div>
					<div>
						<h4 class="text-sm font-semibold text-[#0a0a0a]">
							{$form.full_name || 'Seu Nome Profissional'}
						</h4>
						<p class="font-mono text-[11px] text-[#a3a3a3]">
							coelo.dev/{cleanedUsernamePreview || 'seu-link'}
						</p>
					</div>
				</div>
				<div
					class="flex items-center gap-1 rounded-full border border-[#e5e5e5] bg-white px-2.5 py-1 text-[10px] font-semibold tracking-tight text-[#525252]"
				>
					<span class="size-1.5 animate-pulse rounded-full bg-emerald-500"></span> Preview da agenda
				</div>
			</div>

			<div class="grid flex-1 grid-cols-1 items-stretch gap-5 md:grid-cols-12">
				<div
					class="border-rgba(0,0,0,0.04) flex flex-col justify-between rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] md:col-span-5"
				>
					<div class="space-y-3">
						<div
							class="inline-flex rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white transition-colors duration-200"
							style="background-color: {$form.first_service_color};"
						>
							Disponível
						</div>
						<h3 class="text-base leading-snug font-medium break-words text-[#0a0a0a]">
							{$form.first_service_name || 'Escolha o nome do serviço'}
						</h3>
					</div>

					<div class="mt-4 space-y-2 border-t border-[#f5f5f5] pt-6">
						<div class="flex items-center gap-2 text-xs text-[#525252]">
							<Clock size={13} class="text-[#a3a3a3]" />
							<span>{$form.first_service_duration} minutos</span>
						</div>
						{#if $form.address_custom}
							<div class="flex items-center gap-2 text-xs text-[#525252]" transition:fade>
								<MapPin size={13} class="text-[#a3a3a3]" />
								<span class="truncate">{$form.address_custom}</span>
							</div>
						{/if}
					</div>
				</div>

				<div
					class="border-rgba(0,0,0,0.04) flex flex-col justify-between rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] md:col-span-7"
				>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="flex items-center gap-1 text-xs font-semibold text-[#262626]">
								<Calendar size={12} class="text-[#a3a3a3]" /> Selecione o horário
							</span>
							<span class="text-[10px] text-[#a3a3a3]">Maio 2026</span>
						</div>

						<div class="grid grid-cols-2 gap-2">
							{#each ['09:00', '11:30', '14:00', '16:30'] as time, i}
								<div
									class="cursor-pointer rounded-lg border p-2.5 text-center text-xs font-medium transition-all duration-200 select-none"
									style={i === 1
										? `background-color: ${$form.first_service_color}10; border-color: ${$form.first_service_color}; color: ${$form.first_service_color}; font-weight: 600;`
										: 'border-color: #e5e5e5; color: #525252; background: transparent;'}
								>
									{time}
								</div>
							{/each}
						</div>
					</div>

					<div class="mt-4 border-t border-[#f5f5f5] pt-3 text-center text-[10px] text-[#a3a3a3]">
						Já possui uma conta? <a href="/login" class="font-medium text-[#0a0a0a] underline"
							>Fazer Login</a
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
