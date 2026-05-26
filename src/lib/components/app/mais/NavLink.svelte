<script>
	import { ChevronRight } from '@lucide/svelte';
	let { href, icon: Icon, children } = $props();
</script>

<a
	{href}
	class="group flex w-full items-center gap-3.5 border-b border-zinc-100 px-4 py-3.5 transition-all last:border-0 active:bg-zinc-50/70"
>
	<div
		class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 text-zinc-600 transition-colors group-hover:bg-zinc-100 group-hover:text-zinc-900"
	>
		<Icon class="size-4.5" />
	</div>
	<p
		class="flex-1 text-[14.5px] font-medium tracking-tight text-zinc-700 group-hover:text-zinc-900"
	>
		{@render children()}
	</p>
	<ChevronRight
		class="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
	/>
</a>
