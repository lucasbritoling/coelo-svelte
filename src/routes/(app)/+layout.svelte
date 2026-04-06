<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
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
	<Sidebar.Inset class="flex h-svh flex-col">
		<header class="sticky! top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<Sidebar.Trigger class="-ms-1" />
			<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Page></Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
		<main class="flex min-w-0! flex-1 flex-col gap-4 p-4 sm:items-center">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
