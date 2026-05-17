<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { Calendar, CalendarDays } from '@lucide/svelte';
	interface Props {
		selectedDate: string;
		onSelect: (date: string) => void;
		onOpenPicker: () => void;
	}

	let { selectedDate, onSelect, onOpenPicker }: Props = $props();

	const fmt = {
		iso: new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }),
		weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
	};

	const strip = $derived.by(() => {
		const [y, m, d] = selectedDate.split('-').map(Number);
		const center = new Date(y, m - 1, d);
		// Renderizamos 6 dias, pois o 7º será o 'ver calendar'
		return Array.from({ length: 6 }, (_, i) => {
			const date = new Date(center);
			date.setDate(center.getDate() - 1 + i);
			return {
				str: fmt.iso.format(date),
				day: date.getDate(),
				wd: fmt.weekday.format(date).replace('.', '').slice(0, 3).toUpperCase()
			};
		});
	});
</script>

<div class="no-scrollbar flex gap-3 overflow-x-auto px-5 pt-2 pb-0">
	{#each strip as day}
		<button
			onclick={() => onSelect(day.str)}
			class="flex aspect-square h-17 w-16.5 shrink-0 flex-col items-center justify-center rounded-full border transition-all active:scale-95
            {day.str === selectedDate
				? 'border-foreground opacity-100'
				: 'border-foreground/10 opacity-60'}"
		>
			<span
				class="text-[10.5px] leading-none font-medium tracking-wide uppercase
                {day.str === selectedDate ? 'text-foreground' : 'text-muted-foreground'}"
			>
				{day.wd}
			</span>
			<span
				class="mt-1 text-[18px] leading-none font-semibold
                {day.str === selectedDate ? 'text-foreground' : 'text-muted-foreground'}"
			>
				{day.day}
			</span>
		</button>
	{/each}
	<button
		class="flex aspect-square h-17 w-16.5 shrink-0 flex-col items-center justify-center rounded-full border border-foreground/10 bg-muted opacity-80 transition-all active:scale-95"
		onclick={() => (ui.isDatePickerOpen = true)}
	>
		<span
			class="text-[10.5px] leading-none font-semibold tracking-widest text-muted-foreground uppercase"
		>
			Ver
		</span>
		<CalendarDays class="mt-1 h-5 w-5 text-muted-foreground" />
	</button>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
