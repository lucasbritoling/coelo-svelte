<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	let { slots = [], onSlotClick } = $props<{
		slots: Array<{ startAt: string; duration: number }>;
		onSlotClick: (startAt: string) => void;
	}>();

	let isExpanded = $state(false);

	const totalSlots = $derived(slots?.length ?? 0);
</script>

{#if totalSlots > 0}
	<div class="w-full select-none">
		<button
			type="button"
			class="flex w-full items-center justify-between rounded-[14px] border border-dashed border-zinc-200/80 bg-zinc-50/40 px-4 py-3 text-left transition-all duration-200 hover:bg-zinc-50/80 active:scale-[0.99]"
			onclick={() => (isExpanded = !isExpanded)}
		>
			<span class="text-[12px] font-medium tracking-wide text-zinc-500">
				+{totalSlots} horário{totalSlots > 1 ? 's' : ''} livre{totalSlots > 1 ? 's' : ''}
			</span>
			<ChevronDown
				class="size-4 text-zinc-400 transition-transform duration-300 ease-out {isExpanded
					? '-rotate-180'
					: 'rotate-0'}"
			/>
		</button>

		{#if isExpanded}
			<div
				transition:slide={{ duration: 200 }}
				class="mt-2 grid grid-cols-4 gap-2 rounded-[16px] border border-zinc-100/50 bg-zinc-50/30 p-2"
			>
				{#each slots as slot}
					<button
						type="button"
						class="flex h-9 items-center justify-center rounded-lg border border-zinc-200/60 bg-white/70 text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 active:scale-95"
						onclick={() => onSlotClick(slot.startAt)}
					>
						<span class="text-[12.5px] font-semibold tracking-tight">{slot.startAt}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
