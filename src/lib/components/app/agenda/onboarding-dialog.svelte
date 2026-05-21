<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { ChevronRight, Link, Settings } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	let { open = $bindable() } = $props<{ open: boolean }>();
	let step = $state(1);

	function next() {
		if (step < 2) step++;
		else {
			// Fecha imediatamente
			open = false;
			// Dispara a mutação no background sem aguardar o retorno
			fetch('?/completeOnboarding', {
				method: 'POST',
				body: new FormData()
			}).catch((err) => console.error('Erro ao finalizar onboarding:', err));
		}
	}
</script>

<Dialog.Root bind:open>
	<!-- A classe 'rounded-[32px]' e 'shadow-2xl' combinam com a precisão dos seus botões -->
	<Dialog.Content
		class="flex max-h-[90dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-0 shadow-2xl sm:max-w-[400px]"
	>
		<!-- Header com o mesmo feeling minimalista dos seus botões -->
		<div class="relative flex flex-col items-center px-8 pt-10 pb-6 text-center">
			<div
				class="mb-6 flex size-14 items-center justify-center rounded-2xl border border-zinc-100 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]"
			>
				{#if step === 1}<Link class="size-7 text-zinc-600" />{/if}
				{#if step === 2}<Settings class="size-7 text-zinc-600" />{/if}
			</div>

			<Dialog.Title class="text-xl font-bold tracking-tight text-zinc-900">
				{step === 1 ? 'Compartilhe seu link' : 'Ajustes e Personalização'}
			</Dialog.Title>
		</div>

		<!-- Conteúdo centralizado -->
		<div class="relative px-8 pb-8 text-center">
			{#key step}
				<p
					in:fly={{ y: 5, duration: 200 }}
					class="text-sm leading-relaxed font-medium text-zinc-500"
				>
					{step === 1
						? 'Basta compartilhar seu link de agendamento com seus clientes e pronto.'
						: 'Precisa configurar horários ou alterar sua foto? Está tudo nas configurações.'}
				</p>
			{/key}
		</div>

		<!-- Footer alinhado com o sistema de design dos botões -->
		<div class="border-t border-zinc-100 bg-zinc-50/50 p-6">
			<div class="flex items-center justify-between gap-4">
				<div class="flex gap-2">
					{#each [1, 2] as s}
						<div
							class="h-1.5 w-1.5 rounded-full {step === s ? 'bg-zinc-900' : 'bg-zinc-200'}"
						></div>
					{/each}
				</div>

				<Button
					onclick={next}
					class="h-11 cursor-pointer rounded-full bg-zinc-900 px-6 font-bold text-white transition-all hover:bg-zinc-800 active:scale-95"
				>
					{step === 2 ? 'Entendido' : 'Próximo'}
					{#if step === 1}<ChevronRight class="ml-1 size-4" />{/if}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
