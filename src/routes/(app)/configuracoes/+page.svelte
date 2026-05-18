<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Clock, LoaderCircle, ChevronLeft } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let isSaving = $state(false);
	let currentInterval = $state(data.profile?.favorite_ghost_slot_interval ?? 30);
</script>

<div class="mx-auto max-w-xl p-5" in:fly={{ x: 16, duration: 250 }}>
	<div class="flex items-center gap-3 pt-3">
		<button
			onclick={() => goto('/mais')}
			class="-ml-2.5 flex size-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/40 bg-white/40 text-zinc-500 transition-all hover:border-zinc-300 hover:bg-white hover:text-zinc-800 active:scale-90"
			aria-label="Voltar para configurações"
		>
			<ChevronLeft size={20} strokeWidth={2.5} />
		</button>
		<h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Ajustes da Agenda</h1>
	</div>

	<div
		class="mt-5 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] backdrop-blur-md"
	>
		<form
			method="POST"
			action="?/updateInterval"
			use:enhance={() => {
				isSaving = true;
				return async ({ result }) => {
					isSaving = false;

					if (result.type === 'success') {
						toast.success('Intervalo padrão atualizado!');
					} else if (result.type === 'failure') {
						const msg = (result.data as any)?.message || 'Erro ao salvar';
						toast.error(msg);
					}
				};
			}}
			class="space-y-5"
		>
			<div class="space-y-2.5">
				<Label for="interval" class="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
					Duração Padrão dos Encaixes (Minutos)
				</Label>

				<p class="text-[13px] leading-relaxed font-medium text-zinc-500">
					Digite o intervalo de tempo padrão (em minutos) utilizado para a geração visual de
					horários livres no seu painel.
				</p>

				<div
					class="rounded-xl border border-zinc-200/40 bg-zinc-50/40 p-3 text-[12px] leading-relaxed text-zinc-400"
				>
					<span class="mb-0.5 block font-bold text-zinc-600">Nota sobre o funcionamento:</span>
					Esta definição só entra em vigor se você tiver
					<strong class="font-semibold text-zinc-600">2 ou mais serviços ativos</strong> cadastrados.
					Caso tenha apenas 1 serviço, os horários livres seguirão automaticamente a duração exata dele.
				</div>

				<div class="relative pt-1.5">
					<Input
						id="interval"
						type="text"
						inputmode="numeric"
						name="favorite_ghost_slot_interval"
						value={currentInterval}
						disabled={isSaving}
						oninput={(e) => {
							const input = e.currentTarget;
							let raw = input.value.replace(/\D/g, '');
							if (parseInt(raw, 10) > 1440) raw = '1440';
							input.value = raw;
							currentInterval = raw ? parseInt(raw, 10) : 0;
						}}
						class="h-12 w-full rounded-[16px] border-zinc-200/80 bg-zinc-50/50 pr-11 pl-4 text-[15px] font-bold text-zinc-900 transition-colors focus-visible:bg-white focus-visible:ring-zinc-300 disabled:opacity-60"
						placeholder="Ex: 30"
						required
					/>
					<div
						class="pointer-events-none absolute top-[calc(50%+3px)] right-4 flex size-5 -translate-y-1/2 items-center justify-center text-zinc-400"
					>
						<Clock size={16} />
					</div>
				</div>
			</div>

			<Button
				type="submit"
				disabled={isSaving || !currentInterval}
				class="h-12 w-full rounded-[16px] bg-zinc-900 font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-300"
			>
				{#if isSaving}
					<LoaderCircle class="mr-2 size-4 animate-spin" />
					Salvando...
				{:else}
					Salvar Intervalo
				{/if}
			</Button>
		</form>
	</div>
</div>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
