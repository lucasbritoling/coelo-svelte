<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { ui } from '$lib/state/ui.svelte';

	let { children } = $props();

	let isMobile = $state(false);

	$effect(() => {
		if (ui.isModalOpen) {
			// Só adiciona no histórico se a entrada atual não for já um modal
			// Isso evita duplicatas se múltiplos modais abrirem em cadeia
			if (history.state?.modal !== true) {
				history.pushState({ modal: true }, '');
			}
		}
	});

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 640; // 640px é o breakpoint 'sm' do Tailwind
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);

		const handlePopState = () => {
			if (ui.isModalOpen) {
				// Se o usuário clicou em 'voltar' e tinha modal aberto, fechamos o modal
				ui.closeAll();
			}
		};
		window.addEventListener('popstate', handlePopState);

		return () => {
			// Limpeza de todos os eventos ao destruir o layout
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('popstate', handlePopState);
		};
	});
</script>

<svelte:head>
	<title>Coelo</title>
	<meta name="description" content="Link de autoagendamento. Rápido. Simples." />
</svelte:head>

<Toaster
	richColors
	expand={false}
	position={isMobile ? 'top-center' : 'bottom-center'}
	visibleToasts={1}
	toastOptions={{
		// w-fit + mx-auto garante que ele fique "magrinho" e centralizado
		class: 'w-fit mx-auto border-border/50 bg-background shadow-lg font-sans'
	}}
/>

{@render children()}

<style>
	/* Customização para manter o Toast "magrinho" e no topo no mobile */
	@media (max-width: 479px) {
		:global([data-sonner-toaster]) {
			top: 0 !important;
			bottom: auto !important;
			left: 0 !important;
			right: 0 !important;
			padding-top: calc(env(safe-area-inset-top) + 24px) !important;
			display: flex !important;
			flex-direction: column !important;
			align-items: center !important;
		}

		:global([data-sonner-toast]) {
			--y: 0px !important;
			position: relative !important;
			/* Garante que o toast não estique para 100% da largura do container */
			width: fit-content !important;
			margin-left: auto !important;
			margin-right: auto !important;
		}

		/* Efeito de deslize lateral ao remover */
		:global([data-sonner-toast][data-removed='true']) {
			transform: translateX(100%) !important;
			opacity: 0;
			transition:
				transform 0.4s ease-in,
				opacity 0.2s ease-in !important;
		}
	}
</style>
