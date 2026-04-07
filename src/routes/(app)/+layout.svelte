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
	<Sidebar.Inset class="flex h-svh flex-col overflow-hidden">
		<header
			class="sticky! bottom-0! z-20 order-last flex h-16 shrink-0 items-center gap-2 border-t bg-background px-4 sm:top-0! sm:bottom-auto! sm:order-0 sm:border-t-0 sm:border-b"
		>
			<Sidebar.Trigger class="order-last -me-1 sm:order-0 sm:-ms-1 sm:me-0" />
			<Separator
				orientation="vertical"
				class="me-2 hidden data-[orientation=vertical]:h-4 sm:block"
			/>
			<Breadcrumb.Root class="flex-1">
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Page></Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
		<main
			class="order-first flex min-w-0! flex-1 flex-col gap-4 overflow-y-auto p-4 sm:order-0 sm:items-center"
		>
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
