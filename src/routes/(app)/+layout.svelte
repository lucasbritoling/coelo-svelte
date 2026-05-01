<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import { Calendar, Clock, UsersRound, BriefcaseBusiness } from '@lucide/svelte';
	import BottomNav from '$lib/components/bottom-nav.svelte';

	import { Toaster } from 'svelte-sonner';
	let { children } = $props();
	const navItems = [
		{ href: '/agenda', icon: Calendar, label: 'Agenda' },
		{ href: '/horarios', icon: Clock, label: 'Horários' },
		{ href: '/clientes', icon: UsersRound, label: 'Clientes' },
		{ href: '/servicos', icon: BriefcaseBusiness, label: 'Serviços' }
	];
</script>

<Toaster
	richColors
	closeButton
	position="bottom-center"
	toastOptions={{
		class: 'border-border/50 bg-background shadow-lg font-sans'
	}}
/>

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
	<main class="flex-1 overflow-y-auto bg-zinc-50 p-4">
		{@render children()}
	</main>
	<BottomNav />
</div>

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
