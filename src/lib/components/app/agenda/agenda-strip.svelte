<script lang="ts">
	interface Props {
		selectedDate: string;
		onSelect: (date: string) => void;
	}

	let { selectedDate, onSelect }: Props = $props();

	const fmt = {
		iso: new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }),
		weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
	};

	const strip = $derived.by(() => {
		const [y, m, d] = selectedDate.split('-').map(Number);
		const center = new Date(y, m - 1, d);

		return Array.from({ length: 7 }, (_, i) => {
			const date = new Date(center);
			date.setDate(center.getDate() - 3 + i);
			return {
				str: fmt.iso.format(date),
				day: date.getDate(),
				wd: fmt.weekday.format(date).replace('.', '').slice(0, 3).toUpperCase()
			};
		});
	});
</script>

<div class="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-1 pb-0">
	{#each strip as day}
		<button
			onclick={() => onSelect(day.str)}
			class="flex min-w-[54px] shrink-0 flex-col items-center rounded-2xl border py-3 transition-all active:scale-90
            {day.str === selectedDate
				? 'border-zinc-900 bg-zinc-900 text-white'
				: 'border-transparent bg-zinc-100 text-zinc-500'}"
		>
			<span class="text-[9px] font-bold tracking-widest uppercase">{day.wd}</span>
			<span class="mt-0.5 text-[15px] font-semibold">{day.day}</span>
		</button>
	{/each}
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
