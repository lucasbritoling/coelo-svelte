<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { ChevronRight, CalendarCheck, Settings, Sparkles } from '@lucide/svelte';

	let { open = $bindable() } = $props();
	let step = $state(1);

	function next() {
		if (step < 3) step++;
	}

	function close() {
		open = false;
		// Opcional: chamar API aqui para marcar is_onboarded = true
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle class="text-xl">
				{#if step === 1}Bem-vindo ao Coelo{/if}
				{#if step === 2}Link de Autoagendamento{/if}
				{#if step === 3}Personalize sua Agenda{/if}
			</DialogTitle>
		</DialogHeader>

		<div class="grid gap-6 py-4">
			<!-- Passo 1: Intro -->
			{#if step === 1}
				<div class="flex flex-col items-center text-center space-y-4">
					<div class="p-4 bg-primary/10 rounded-full">
						<Sparkles class="w-8 h-8 text-primary" />
					</div>
					<p class="text-muted-foreground">
						Sua jornada para organizar seus atendimentos começa aqui. Simples, rápido e eficiente.
					</p>
				</div>
			{/if}

			<!-- Passo 2: Link -->
			{#if step === 2}
				<div class="flex flex-col items-center text-center space-y-4">
					<div class="p-4 bg-primary/10 rounded-full">
						<CalendarCheck class="w-8 h-8 text-primary" />
					</div>
					<p class="text-muted-foreground leading-relaxed">
						Basta compartilhar o seu link personalizado com seus clientes e você já passa a receber seus primeiros agendamentos.
					</p>
				</div>
			{/if}

			<!-- Passo 3: Config -->
			{#if step === 3}
				<div class="flex flex-col items-center text-center space-y-4">
					<div class="p-4 bg-primary/10 rounded-full">
						<Settings class="w-8 h-8 text-primary" />
					</div>
					<p class="text-muted-foreground leading-relaxed">
						Você pode definir seu horário de trabalho, foto de perfil e muito mais na seção de configurações.
					</p>
				</div>
			{/if}

			<!-- Stepper Footer -->
			<div class="flex justify-between items-center mt-4">
				<div class="flex gap-1">
					{#each [1, 2, 3] as s}
						<div class="w-2 h-2 rounded-full {step === s ? 'bg-primary' : 'bg-muted'}"></div>
					{/each}
				</div>

				<Button onclick={step === 3 ? close : next}>
					{step === 3 ? 'Começar agora' : 'Próximo'}
					{#if step < 3}<ChevronRight class="w-4 h-4 ml-1" />{/if}
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>