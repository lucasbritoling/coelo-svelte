<script lang="ts">
	let { duration, startAt, onclick } = $props<{
		duration: number;
		startAt: string;
		onclick: () => void;
	}>();

	const label = $derived(
		duration >= 60
			? `${Math.floor(duration / 60)}h${duration % 60 || ''} livre`
			: `${duration} min livre`
	);
</script>

<button
	{onclick}
	class="group flex w-full items-center justify-center gap-3 rounded-[24px] border border-dashed border-zinc-200 py-4 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
>
	<div class="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-500">
		<span class="text-[11px] font-bold tracking-widest uppercase">{startAt}</span>
		<div class="h-px w-4 bg-zinc-200"></div>
		<span class="text-xs font-medium">{label}</span>
	</div>
	<div
		class="flex size-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600"
	>
		<span class="text-lg leading-none">+</span>
	</div>
</button>
