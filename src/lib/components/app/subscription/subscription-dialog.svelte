<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Check, Crown, LoaderCircle, Zap, ShieldCheck, Star } from '@lucide/svelte';
	import { fade, scale } from 'svelte/transition';

	let { open = $bindable() } = $props<{ open: boolean }>();

	let isLoading = $state(false);
	let billingPeriod = $state<'monthly' | 'yearly'>('yearly');

	const plans = {
		monthly: { price: '29,90', label: '/mês' },
		yearly: { price: '24,90', label: '/mês', total: '298,80', discount: '20% OFF' }
	};

	const features = [
		'Serviços e clientes ilimitados',
		'Link de agendamento personalizado',
		'Lembretes automáticos via WhatsApp',
		'Relatórios de faturamento mensais',
		'Suporte prioritário via chat'
	];

	async function handleSubscribe() {
		isLoading = true;
		// Simulação de checkout
		setTimeout(() => {
			isLoading = false;
			open = false;
		}, 2000);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[95dvh] w-[95vw] flex-col gap-0 overflow-hidden rounded-[32px] border border-zinc-200/50 bg-white/90 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[400px]"
	>
		<div class="relative flex flex-col items-center px-6 pt-10 pb-6 text-center">
			<div
				class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(24,24,27,0.05),transparent)]"
			></div>

			<div
				class="mb-4 flex size-14 items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/50 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-md"
			>
				<Crown class="size-7 text-zinc-900" strokeWidth={2.2} />
			</div>

			<Dialog.Title class="text-2xl font-bold tracking-tight text-zinc-900">
				Seja Premium
			</Dialog.Title>
			<Dialog.Description class="mt-1.5 text-[14px] font-medium text-zinc-500">
				Tudo o que você precisa para escalar seu negócio.
			</Dialog.Description>
		</div>

		<div class="flex justify-center px-6 pb-6">
			<div class="flex rounded-full bg-zinc-100 p-1">
				<button
					onclick={() => (billingPeriod = 'monthly')}
					class="rounded-full px-4 py-1.5 text-xs font-bold transition-all {billingPeriod ===
					'monthly'
						? 'bg-white text-zinc-900 shadow-sm'
						: 'text-zinc-500'}"
				>
					Mensal
				</button>
				<button
					onclick={() => (billingPeriod = 'yearly')}
					class="relative rounded-full px-4 py-1.5 text-xs font-bold transition-all {billingPeriod ===
					'yearly'
						? 'bg-white text-zinc-900 shadow-sm'
						: 'text-zinc-500'}"
				>
					Anual
					{#if billingPeriod === 'yearly'}
						<span
							transition:scale
							class="absolute -top-2 -right-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white uppercase"
						>
							-20%
						</span>
					{/if}
				</button>
			</div>
		</div>

		<div class="space-y-3 px-6 pb-8">
			{#each features as feature}
				<div class="flex items-center gap-3">
					<div class="flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900">
						<Check class="size-3 text-white" strokeWidth={4} />
					</div>
					<span class="text-[14px] font-medium text-zinc-600">{feature}</span>
				</div>
			{/each}
		</div>

		<div class="border-t border-zinc-100 bg-zinc-50/50 p-6 backdrop-blur-md">
			<div class="mb-4 flex items-end justify-between">
				<div>
					<p class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">Investimento</p>
					<div class="flex items-baseline gap-1">
						<span class="text-3xl font-black text-zinc-900">R$ {plans[billingPeriod].price}</span>
						<span class="text-sm font-medium text-zinc-500">{plans[billingPeriod].label}</span>
					</div>
				</div>
				{#if billingPeriod === 'yearly'}
					<p class="text-right text-[10px] font-bold text-emerald-600 uppercase">
						Economize R$ 60/ano
					</p>
				{/if}
			</div>

			<Button
				onclick={handleSubscribe}
				disabled={isLoading}
				class="h-14 w-full rounded-[20px] bg-zinc-900 text-base font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
			>
				{#if isLoading}
					<LoaderCircle class="mr-2 size-5 animate-spin" />
					Processando...
				{:else}
					Assinar Agora
				{/if}
			</Button>

			<div class="mt-4 flex items-center justify-center gap-4">
				<div class="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
					<ShieldCheck class="size-3" /> Pagamento Seguro
				</div>
				<div class="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
					<Zap class="size-3" /> Ativação Imediata
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
