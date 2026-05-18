<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	// 🔴 ALTERAÇÃO: Importado ChevronLeft junto com Clock e LoaderCircle
	import { Clock, LoaderCircle, ChevronLeft } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	// 🔴 ALTERAÇÃO: Importado o goto para a navegação do botão voltar
	import { goto } from '$app/navigation';

	let { data } = $props();

	let isSaving = $state(false);

	let currentInterval = $state(data.profile?.favorite_ghost_slot_interval ?? 30);
</script>

<div class="mx-auto max-w-xl p-5">
	<div class="flex items-center gap-2 pt-3">
		<button
			onclick={() => goto('/mais')}
			class="-ml-2 flex items-center p-2 text-zinc-500 transition-transform active:scale-90"
		>
			<ChevronLeft size={24} strokeWidth={2.5} />
		</button>
		<h1 class="text-[26px] leading-tight font-medium tracking-tight text-zinc-900">
			Ajustes da Agenda
		</h1>
	</div>

	<div class="mt-5 overflow-hidden rounded-2xl border border-border/40 bg-card p-5">
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
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="interval" class="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
					Duração Padrão dos Encaixes (Minutos)
				</Label>
				<p class="text-xs leading-relaxed text-zinc-600">
					Digite o intervalo de tempo padrão (em minutos) utilizado para a geração visual de
					horários livres no seu painel.
				</p>
				<div
					class="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-500"
				>
					<span class="mb-0.5 block font-bold text-zinc-700">Nota sobre o funcionamento:</span>
					Esta definição só entra em vigor se você tiver
					<strong class="text-zinc-800">2 ou mais serviços ativos</strong> cadastrados. Caso tenha apenas
					1 serviço, os horários livres seguirão automaticamente a duração exata dele.
				</div>

				<div class="relative mt-2">
					<Input
						id="interval"
						type="text"
						inputmode="numeric"
						name="favorite_ghost_slot_interval"
						value={currentInterval}
						disabled={isSaving}
						oninput={(e) => {
							const input = e.currentTarget;
							// Remove qualquer caractere que não seja número de 0 a 9
							let raw = input.value.replace(/\D/g, '');

							// Evita valores absurdos ou que estourem o smallint do Postgres
							if (parseInt(raw, 10) > 1440) raw = '1440'; // Máximo 24h

							input.value = raw;
							currentInterval = raw ? parseInt(raw, 10) : 0;
						}}
						class="h-12 w-full rounded-xl border border-zinc-100 bg-zinc-50 pr-10 pl-4 font-bold text-zinc-900 focus-visible:ring-zinc-200 disabled:opacity-60"
						placeholder="Ex: 30"
						required
					/>
					<div
						class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400"
					>
						<Clock size={16} />
					</div>
				</div>
			</div>

			<Button
				type="submit"
				disabled={isSaving || !currentInterval}
				class="h-11 w-full rounded-xl bg-zinc-900 font-bold text-white transition-all active:scale-95 disabled:bg-zinc-700"
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
