<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import { Toaster } from 'svelte-sonner';
	let { children } = $props();
</script>

<Toaster
	richColors
	closeButton
	position="bottom-right"
	toastOptions={{
		class: 'border-border/50 bg-background shadow-lg font-sans'
	}}
/>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset class="flex h-svh flex-col overflow-hidden">
		<header
			class="sticky! bottom-0! z-20 order-last flex h-16 shrink-0 items-center gap-2 border-t bg-zinc-50! px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] xs:top-0! xs:bottom-auto! xs:order-0 xs:border-t-0 xs:border-b xs:bg-background xs:shadow-none dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]"
		>
			<Sidebar.Trigger class="order-last -me-1 xs:order-0 xs:-ms-1 xs:me-0" />
			<Separator
				orientation="vertical"
				class="me-2 hidden data-[orientation=vertical]:h-4 xs:block"
			/>

		</header>
		<main
			class="order-first flex min-w-0! flex-1 flex-col gap-4 overflow-y-auto bg-zinc-50! p-4 xs:order-0 xs:items-center"
		>
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
