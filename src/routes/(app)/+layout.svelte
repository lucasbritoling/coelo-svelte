<script lang="ts">
	import BottomNav from '$lib/components/app/agenda/agenda-bottom-nav.svelte';
	let { children } = $props();
</script>

<div class="flex h-svh w-full justify-center bg-zinc-100 dark:bg-black">
	<div
		class="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl"
	>
		<main class="flex-1 overflow-x-hidden overflow-y-auto pb-0">
			{@render children()}
		</main>

		<BottomNav />
	</div>
</div>
