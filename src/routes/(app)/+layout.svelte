<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import { Calendar, Clock, UsersRound, BriefcaseBusiness } from '@lucide/svelte';

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

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset class="flex h-svh flex-col overflow-hidden">
		<div class="flex flex-1 flex-col overflow-hidden xs:flex-row md:flex-col">
			<header
				class="sticky! bottom-0! z-20 order-last flex h-16 shrink-0 items-center gap-2 border-t bg-zinc-50! px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]
                xs:relative! xs:order-first! xs:h-full xs:w-16 xs:flex-col xs:justify-start xs:gap-4 xs:border-t-0 xs:border-r xs:bg-background xs:pt-4 xs:shadow-none
                md:hidden!
                dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]"
			>
				<!-- 1. Trigger: Primeiro no HTML para ficar no topo no modo Rail (xs) -->
				<!-- No mobile (<480px), o 'order-last' joga ele para a direita na bottom-bar -->
				<Sidebar.Trigger class="order-last cursor-pointer xs:order-none xs:ms-0 xs:mb-2" />

				<!-- 2. Nav: Segundo no HTML -->
				<nav class="flex flex-1 items-center justify-around xs:flex-col xs:justify-start xs:gap-6">
					{#each navItems as item}
						<a
							href={item.href}
							class="flex flex-col items-center gap-1 p-2 transition-all duration-75 active:scale-95 active:opacity-70 {page
								.url.pathname === item.href
								? 'text-primary'
								: 'text-muted-foreground'}"
						>
							<item.icon class="size-6" />
						</a>
					{/each}
				</nav>
			</header>

			<!-- HEADER DESKTOP -->
			<header class="hidden h-16 shrink-0 items-center gap-2 border-b px-4 md:flex">
				<Sidebar.Trigger class="-ms-1 cursor-pointer hover:bg-zinc-100" />
			</header>

			<main
				class="order-first flex min-w-0! flex-1 flex-col gap-4 overflow-y-auto bg-zinc-50! p-4 pb-24 xs:order-last xs:items-center xs:pb-4 md:order-none"
			>
				{@render children()}
			</main>
		</div>
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
