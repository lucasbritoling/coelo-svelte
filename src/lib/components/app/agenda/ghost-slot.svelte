<script lang="ts">
	let { slots = [], onSlotClick } = $props<{
		slots: Array<{ startAt: string; duration: number }>;
		onSlotClick: (startAt: string) => void;
	}>();

	let isExpanded = $state(false);

	const totalSlots = $derived(slots?.length ?? 0);
	const isSingle = $derived(totalSlots === 1);
</script>

{#if totalSlots > 0}
	<div class="ghost-group">
		{#if isSingle}
			<button class="slot-row" onclick={() => onSlotClick(slots[0].startAt)}>
				<span class="dot"></span>
				<span class="time">{slots[0].startAt}</span>
				<span class="label">livre</span>
			</button>
		{:else}
			<button class="slot-row toggle" onclick={() => (isExpanded = !isExpanded)}>
				<span class="dot"></span>
				<span class="time">{slots[0].startAt}</span>
				<span class="label">+{totalSlots} livres</span>
				<span class="chevron" class:open={isExpanded}>›</span>
			</button>

			{#if isExpanded}
				<div class="expanded">
					{#each slots as slot}
						<button class="slot-row sub" onclick={() => onSlotClick(slot.startAt)}>
							<span class="dot small"></span>
							<span class="time">{slot.startAt}</span>
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.ghost-group {
		display: flex;
		flex-direction: column;
		width: fit-content;
		min-width: 130px;
	}

	.slot-row {
		all: unset;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px 4px 6px;
		border-left: 2px solid #c8e6c9;
		cursor: pointer;
		border-radius: 0 4px 4px 0;
		transition:
			background 0.12s,
			border-color 0.12s;
		white-space: nowrap;
	}

	.slot-row:hover {
		background: #f1f8f1;
		border-color: #66bb6a;
	}

	.slot-row:active {
		background: #e8f5e9;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #81c784;
		flex-shrink: 0;
	}

	.dot.small {
		width: 4px;
		height: 4px;
		background: #a5d6a7;
	}

	.time {
		font-family: 'JetBrains Mono', 'Fira Mono', 'Courier New', monospace;
		font-size: 0.78rem;
		font-weight: 500;
		color: #2e7d32;
		letter-spacing: 0.01em;
	}

	.label {
		font-family: system-ui, sans-serif;
		font-size: 0.68rem;
		color: #81c784;
		letter-spacing: 0.04em;
		text-transform: lowercase;
	}

	.chevron {
		font-size: 0.85rem;
		color: #a5d6a7;
		line-height: 1;
		transform: rotate(90deg);
		transition: transform 0.18s ease;
		margin-left: 2px;
	}

	.chevron.open {
		transform: rotate(-90deg);
	}

	.expanded {
		display: flex;
		flex-direction: column;
		padding-left: 10px;
		border-left: 2px solid #e8f5e9;
		margin-left: 6px;
		gap: 1px;
		animation: slide-down 0.15s ease;
	}

	.slot-row.sub {
		border-left: none;
		padding-left: 4px;
	}

	.slot-row.sub:hover {
		border-color: transparent;
	}

	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
