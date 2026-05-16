<script lang="ts">
        let { slots = [], onSlotClick } = $props<{
                slots: Array<{ startAt: string; duration: number }>;
                onSlotClick: (startAt: string) => void;
        }>();

        let isExpanded = $state(false);

        // Fallbacks defensivos para evitar quebras se slots vier undefined/vazio
        const totalSlots = $derived(slots?.length ?? 0);
        const isSingle = $derived(totalSlots === 1);
</script>

<div style="padding: 10px; border: 1px solid red; margin: 5px;">
        <p><strong>Debug Ghost Slots:</strong> {totalSlots} encontrado(s)</p>

        {#if totalSlots === 0}
                <p>Nenhum slot neste grupo.</p>
        {:ELSEIF isSingle}
                <button onclick={() => onSlotClick(slots[0].startAt)}>
                        {slots[0].startAt} - ({slots[0].duration} min) [Agendar]
                </button>
        {:ELSE}
                <button onclick={() => (isExpanded = !isExpanded)}>
                        {slots[0].startAt} - Ver {totalSlots} horários {isExpanded ? '▲' : '▼'}
                </button>

                {#if isExpanded}
                        <div style="margin-left: 20px; display: flex; flex-col; gap: 5px; padding-top: 5px;">
                                {#each slots as slot}
                                        <button onclick={() => onSlotClick(slot.startAt)}>
                                                {slot.startAt} - ({slot.duration} min) [+]
                                        </button>
                                {/each}
                        </div>
                {/if}
        {/if}
</div>
