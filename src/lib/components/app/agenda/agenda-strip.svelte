<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { CalendarDays } from '@lucide/svelte';

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

<div
	class="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-5 py-3.5"
	ontouchstart={(e) => e.stopPropagation()}
	ontouchend={(e) => e.stopPropagation()}
	onwheel={(e) => {
		if (e.deltaY !== 0) {
			e.preventDefault();
			e.currentTarget.scrollLeft += e.deltaY;
		}
	}}
>
	{#each strip as day}
		{@const isSelected = day.str === selectedDate}
		<button
			onclick={() => onSelect(day.str)}
			class="group flex h-[72px] w-[66px] shrink-0 cursor-pointer snap-center flex-col items-center justify-center rounded-[20px] border transition-all duration-300 ease-out select-none active:scale-95
			{isSelected
				? 'border-neutral-950 bg-white font-bold text-neutral-950 shadow-[0_4px_12px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)]'
				: 'border-neutral-200/50 bg-white/40 text-neutral-400 backdrop-blur-md hover:border-neutral-300 hover:bg-white/60 hover:text-neutral-600'}"
		>
			<span
				class="text-[10px] leading-none tracking-wider uppercase transition-colors duration-200
				{isSelected
					? 'font-bold text-neutral-950'
					: 'font-medium text-neutral-400 group-hover:text-neutral-500'}"
			>
				{day.wd}
			</span>
			<span
				class="mt-1 text-xl leading-none tracking-tight transition-colors duration-200
				{isSelected
					? 'font-bold text-neutral-950'
					: 'font-semibold text-neutral-500 group-hover:text-neutral-700'}"
			>
				{day.day}
			</span>
		</button>
	{/each}

	<button
		class="group flex h-[72px] w-[66px] shrink-0 cursor-pointer snap-center flex-col items-center justify-center rounded-[20px] border border-dashed border-neutral-200 bg-white/30 backdrop-blur-sm transition-all duration-300 hover:border-neutral-300 hover:bg-white/60 active:scale-95"
		onclick={() => {
			ui.isDatePickerOpen = true;
			onOpenPicker();
		}}
	>
		<span
			class="text-[10px] leading-none font-semibold tracking-widest text-neutral-400 uppercase transition-colors group-hover:text-neutral-600"
		>
			Ver
		</span>
		<CalendarDays
			class="mt-1 h-4.5 w-4.5 text-neutral-400 transition-colors group-hover:text-neutral-600"
		/>
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
