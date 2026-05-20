<script lang="ts">
	let { slots = [], onSlotClick } = $props<{
		slots: Array<{ startAt: string; duration: number }>;
		onSlotClick: (startAt: string) => void;
	}>();

	let isExpanded = $state(false);

	const totalSlots = $derived(slots?.length ?? 0);
	// Otimização: Texto computado uma única vez por alteração na lista
	const labelText = $derived(
		`+${totalSlots} horário${totalSlots > 1 ? 's' : ''} livre${totalSlots > 1 ? 's' : ''}`
	);
</script>

{#if totalSlots > 0}
	<div class="w-full select-none">
		<button
			type="button"
			class="flex w-full items-center justify-between rounded-[14px] border border-dashed border-zinc-200/80 bg-zinc-50/40 px-4 py-3 text-left transition-all duration-200 hover:bg-zinc-50/80 active:scale-[0.99]"
			onclick={() => (isExpanded = !isExpanded)}
		>
			<span class="text-[12px] font-medium tracking-wide text-zinc-500">
				{labelText}
			</span>

			<svg
				xmlns="http://w3.org"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-4 text-zinc-400 transition-transform duration-200 ease-out {isExpanded
					? '-rotate-180'
					: 'rotate-0'}"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</button>

		<!-- OTIMIZAÇÃO: Transição baseada em opacidade e visibilidade (Executada 100% na GPU, zero Reflow) -->
		<div
			class="mt-2 grid grid-cols-4 gap-2 rounded-[16px] border border-zinc-100/50 bg-zinc-50/30 p-2 transition-all duration-150 ease-out"
			class:opacity-100={isExpanded}
			class:opacity-0={!isExpanded}
			class:pointer-events-none={!isExpanded}
			style:visibility={isExpanded ? 'visible' : 'hidden'}
			style:height={isExpanded ? 'auto' : '0px'}
			style:overflow={isExpanded ? 'visible' : 'hidden'}
		>
			{#each slots as slot (slot.startAt)}
				<button
					type="button"
					class="flex h-9 items-center justify-center rounded-lg border border-zinc-200/60 bg-white/90 text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-100 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 active:scale-95"
					onclick={() => onSlotClick(slot.startAt)}
				>
					<span class="text-[12.5px] font-semibold tracking-tight">{slot.startAt}</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
