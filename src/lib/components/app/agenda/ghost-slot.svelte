<script lang="ts">
	let { slots = [], onSlotClick } = $props<{
		slots: Array<{ startAt: string; duration: number }>;
		onSlotClick: (startAt: string) => void;
	}>();

	let isExpanded = $state(false);

	const totalSlots = $derived(slots?.length ?? 0);
</script>

{#if totalSlots > 0}
	<div class="ghost-group">
		<button class="ghost-card" onclick={() => (isExpanded = !isExpanded)}>
			<span class="free-label"
				>+{totalSlots} horário{totalSlots > 1 ? 's' : ''} livre{totalSlots > 1 ? 's' : ''}</span
			>
			<span class="chevron" class:open={isExpanded}>›</span>
		</button>

		{#if isExpanded}
			<div class="expanded">
				{#each slots as slot}
					<button class="ghost-card sub" onclick={() => onSlotClick(slot.startAt)}>
						<span class="time-start">{slot.startAt}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.ghost-group {
		display: flex;
		flex-direction: column;
		gap: 3px;
		width: 100%;
	}

	.ghost-card {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 0.75rem;
		outline: 1.5px dashed #d4d4d8;
		outline-offset: -1px;
		background: #fafafa;
		padding: 0.45rem 0.75rem 0.45rem 0.9rem;
		cursor: pointer;
		transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		width: 100%;
	}

	.ghost-card:hover {
		background: #f4f4f5;
		outline-color: #a1a1aa;
	}

	.ghost-card:active {
		background: #e4e4e7;
	}

	.time-start {
		font-size: 12.5px;
		line-height: 1.25;
		font-weight: 600;
		color: #52525b;
	}

	.free-label {
		font-size: 0.75rem;
		font-weight: 400;
		color: #a1a1aa;
		letter-spacing: 0.01em;
		flex: 1;
	}

	.chevron {
		font-size: 1rem;
		color: #a1a1aa;
		line-height: 1;
		transform: rotate(90deg);
		transition: transform 0.18s ease;
	}

	.chevron.open {
		transform: rotate(-90deg);
	}

	.expanded {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding-left: 1rem;
		animation: slide-down 0.15s ease;
	}

	.ghost-card.sub {
		outline-color: #e4e4e7;
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
