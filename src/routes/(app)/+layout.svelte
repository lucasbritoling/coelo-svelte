<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import BottomNav from '$lib/components/bottom-nav.svelte';

	let { children } = $props();
</script>

<div class="hidden md:contents">
	<Sidebar.Provider>
		<AppSidebar />
		<Sidebar.Inset class="flex h-svh flex-col overflow-hidden">
			<header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<Sidebar.Trigger class="-ms-1 cursor-pointer [&_svg]:size-5" />
			</header>
			<main class="flex flex-1 flex-col overflow-y-auto p-6">
				{@render children()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>

<!-- MOBILE: layout fullscreen + bottom nav -->
<div class="flex h-svh flex-col md:hidden">
	<main class="flex-1 overflow-y-auto bg-zinc-50 p-4 pb-1">
		{@render children()}
	</main>
	<BottomNav />
</div>
