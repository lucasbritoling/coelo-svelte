<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Check, Crown, LoaderCircle, Zap, ShieldCheck } from '@lucide/svelte';
	import { scale } from 'svelte/transition';

	let { open = $bindable() } = $props<{ open: boolean }>();

	let isLoading = $state(false);
	let billingPeriod = $state<'monthly' | 'yearly'>('yearly');

	const plans = {
		monthly: { price: '39,90', label: '/mês' },
		yearly: { price: '34,90', label: '/mês', total: '298,80', discount: '20% OFF' }
	};

	const features = [
		'Lembretes automáticos via WhatsApp',
		'Estoque e Financeiro',
		'Serviços e clientes ilimitados',
		'Suporte prioritário via chat'
	];

	async function handleSubscribe() {
		isLoading = true;
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
		<!-- Redução cirúrgica do padding vertical superior em telas pequenas para evitar scroll -->
		<div
			class="relative flex flex-col items-center px-6 pt-10 pb-6 text-center max-[410px]:pt-6 max-[410px]:pb-4"
		>
			<div
				class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(24,24,27,0.05),transparent)]"
			></div>

			<div
				class="mb-4 flex size-14 items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/50 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-md max-[410px]:mb-3"
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

		<!-- Redução cirúrgica da distância do seletor em telas pequenas -->
		<div class="flex justify-center px-6 pb-6 max-[410px]:pb-4">
			<div class="flex rounded-full bg-zinc-100 p-1">
				<button
					onclick={() => (billingPeriod = 'monthly')}
					class="cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-all {billingPeriod ===
					'monthly'
						? 'bg-white text-zinc-900 shadow-sm'
						: 'text-zinc-500'}"
				>
					Mensal
				</button>
				<button
					onclick={() => (billingPeriod = 'yearly')}
					class="relative cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-all {billingPeriod ===
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

		<!-- Ajuste fino no espaçamento da lista de features para telas pequenas -->
		<div class="space-y-3 px-6 pb-8 max-[410px]:space-y-2.5 max-[410px]:pb-5">
			{#each features as feature}
				<div class="flex items-center gap-3">
					<div class="flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900">
						<Check class="size-3 text-white" strokeWidth={4} />
					</div>
					<span class="text-[14px] font-medium text-zinc-600">{feature}</span>
				</div>
			{/each}
		</div>

		<!-- Footer adaptável com segurança anti-wrap e sem scroll -->
		<div class="border-t border-zinc-100 bg-zinc-50/50 p-6 backdrop-blur-md max-[410px]:p-5">
			<!-- flex-wrap e items-end garantem o encaixe perfeito. Se quebrar, o "Economize" vai para baixo perfeitamente alinhado -->
			<div class="mb-4 flex flex-row flex-wrap items-end justify-between gap-x-2 gap-y-1">
				<div class="flex flex-col items-start">
					<p class="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">Investimento</p>
					<!-- whitespace-nowrap impede o wrap interno do preço -->
					<div class="flex items-baseline gap-1 whitespace-nowrap">
						<span class="text-3xl font-black text-zinc-900">R$ {plans[billingPeriod].price}</span>
						<span class="text-sm font-medium text-zinc-500">{plans[billingPeriod].label}</span>
					</div>
				</div>
				{#if billingPeriod === 'yearly'}
					<!-- whitespace-nowrap e ajuste automático de alinhamento textual -->
					<p
						class="mb-1 text-right text-[11px] font-bold whitespace-nowrap text-emerald-600 uppercase max-[350px]:text-left"
					>
						Economize R$ 60/ano
					</p>
				{/if}
			</div>

			<Button
				onclick={handleSubscribe}
				disabled={isLoading}
				class="h-14 w-full cursor-pointer rounded-[20px] bg-zinc-900 text-base font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
			>
				{#if isLoading}
					<LoaderCircle class="mr-2 size-5 animate-spin" />
					Processando...
				{:else}
					Assinar Agora
				{/if}
			</Button>

			<div class="mt-4 flex items-center justify-center gap-4 max-[410px]:mt-3">
				<div
					class="flex items-center gap-1.5 text-[10px] font-bold whitespace-nowrap text-zinc-400 uppercase"
				>
					<ShieldCheck class="size-3" /> Pagamento Seguro
				</div>
				<div
					class="flex items-center gap-1.5 text-[10px] font-bold whitespace-nowrap text-zinc-400 uppercase"
				>
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
