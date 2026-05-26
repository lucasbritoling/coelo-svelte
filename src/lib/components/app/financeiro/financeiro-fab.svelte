<script>
	import { Plus } from '@lucide/svelte';
	let { onclick } = $props();
</script>

<button
	{onclick}
	class="pointer-events-auto flex size-[52px] cursor-pointer items-center justify-center rounded-full border border-zinc-200/50 bg-white text-zinc-900 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-90"
	aria-label="Adicionar transação"
>
	<Plus class="size-6" />
</button>
