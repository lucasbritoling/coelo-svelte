<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import { Calendar, Clock, Users, BriefcaseBusiness } from '@lucide/svelte';

	import { Toaster } from 'svelte-sonner';
	let { children } = $props();
</script>

<Toaster
	richColors
	closeButton
	position="bottom-center"
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
			<Sidebar.Trigger class="order-last -me-1 cursor-pointer xs:order-0 xs:-ms-1 xs:me-0" />
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

<style>
	@media (max-width: 479px) {
		:global([data-sonner-toaster]) {
			/* Forçamos o container a ocupar o topo, mas com um padding generoso */
			top: 0 !important;
			bottom: auto !important;
			left: 0 !important;
			right: 0 !important;

			/* Adicionamos o recuo para ele descer da "zona morta" do navegador */
			padding-top: calc(env(safe-area-inset-top) + 24px) !important;

			/* Inverte a ordem de empilhamento para os novos aparecerem embaixo dos antigos */
			display: flex !important;
			flex-direction: column !important;
			align-items: center !important;
		}

		:global([data-sonner-toast]) {
			/* Remove transformações que o JS tenta usar para "subir" o toast */
			--y: 0px !important;
			position: relative !important;
		}

		/* Mantemos o seu deslize lateral para a direita */
		:global([data-sonner-toast][data-removed='true']) {
			transform: translateX(100%) !important;
			opacity: 0;
			transition:
				transform 0.4s ease-in,
				opacity 0.2s ease-in !important;
		}
	}
</style>
