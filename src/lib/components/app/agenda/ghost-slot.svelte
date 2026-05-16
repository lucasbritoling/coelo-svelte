<script lang="ts">
        import { slide } from 'svelte/transition';
        import { ChevronDown, ChevronUp } from '@lucide/svelte';

        let { slots, onSlotClick } = $props<{
                slots: Array<{ startAt: string; duration: number }>;
                onSlotClick: (startAt: string) => void;
        }>();

        let isExpanded = $state(false);

        // Se houver apenas 1 slot no grupo, ele renderiza direto sem modo sanfona
        const isSingle = $derived(slots.length === 1);
        
        // 🔥 Extrai o primeiro slot com segurança de forma reativa e tipada
        const firstSlot = $derived(slots[0]);

        const formatDuration = (d: number) =>
                d >= 60 ? `${Math.floor(d / 60)}h${d % 60 || ''}` : `${d} min`;
</script>

{#if isSingle}
        <button onclick={() => onSlotClick(firstSlot.startAt)} class="ghost-slot-btn group">
                <div class="content-group group-hover:text-zinc-500">
                        <span class="time-stamp">{firstSlot.startAt}</span>
                        <div class="divider-line"></div>
                        <span class="label-text">{formatDuration(firstSlot.duration)} livre</span>
                </div>
                <div class="action-circle group-hover:bg-zinc-200 group-hover:text-zinc-600">
                        <span class="plus-icon">+</span>
                </div>
        </button>
{:else}
        <div class="flex flex-col gap-1.5">
                <button onclick={() => (isExpanded = !isExpanded)} class="ghost-group-btn group">
                        <div class="content-group group-hover:text-zinc-500">
                                <span class="time-stamp">{slots[0].startAt}</span>
                                <div class="divider-line"></div>
                                <span class="label-text">{slots.length} horários livres</span>
                        </div>
                        <div class="action-circle group-hover:bg-zinc-200 group-hover:text-zinc-600">
                                {#if isExpanded}
                                        <ChevronUp size={16} />
                                {:else}
                                        <ChevronDown size={16} />
                                {/if}
                        </div>
                </button>

                {#if isExpanded}
                        <div transition:slide={{ duration: 200 }} class="relative flex flex-col gap-1.5 pl-4">
                                <div class="absolute top-4 bottom-4 left-[11px] w-px bg-zinc-200"></div>

                                {#each slots as slot}
                                        <button onclick={() => onSlotClick(slot.startAt)} class="ghost-slot-btn group !py-3">
                                                <div class="content-group group-hover:text-zinc-500">
                                                        <span class="time-stamp">{slot.startAt}</span>
                                                        <div class="divider-line !w-2"></div>
                                                        <span class="label-text">{formatDuration(slot.duration)} livre</span>
                                                </div>
                                                <div class="action-circle !size-5 group-hover:bg-zinc-200 group-hover:text-zinc-600">
                                                        <span class="plus-icon !text-lg">+</span>
                                                </div>
                                        </button>
                                {/each}
                        </div>
                {/if}
        </div>
{/if}

<style>
        .ghost-slot-btn,
        .ghost-group-btn {
                display: flex;
                width: 100%;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                border-radius: 24px;
                border-width: 1px;
                padding-top: 1rem;
                padding-bottom: 1rem;
                transition-property: all;
                transition-duration: 150ms;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
        }

        .ghost-slot-btn {
                border-style: dashed;
                border-color: rgb(228 228 231); /* zinc-200 */
                background-color: transparent;
        }

        .ghost-group-btn {
                border-style: solid;
                border-color: rgb(228 228 231); /* zinc-200 */
                background-color: rgb(250 250 250); /* zinc-50 */
        }

        .ghost-slot-btn:hover,
        .ghost-group-btn:hover {
                border-color: rgb(212 212 216); /* zinc-300 */
                background-color: rgb(244 244 245); /* zinc-100 */
        }

        .ghost-slot-btn:active,
        .ghost-group-btn:active {
                transform: scale(0.98);
        }

        .content-group {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: rgb(161 161 170); /* zinc-400 */
                transition-property: color;
                transition-duration: 150ms;
        }

        .time-stamp {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.1em;
                text-transform: uppercase;
        }

        .divider-line {
                height: 1px;
                width: 1rem;
                background-color: rgb(228 228 231); /* zinc-200 */
        }

        .label-text {
                font-size: 0.75rem;
                font-weight: 500;
        }

        .action-circle {
                display: flex;
                height: 1.5rem;
                width: 1.5rem;
                align-items: center;
                justify-content: center;
                border-radius: 9999px;
                background-color: rgb(244 244 245); /* zinc-100 */
                color: rgb(161 161 170); /* zinc-400 */
                transition-property: all;
                transition-duration: 150ms;
        }

        .plus-icon {
                font-size: 1.125rem;
                line-height: 1;
        }
</style>
