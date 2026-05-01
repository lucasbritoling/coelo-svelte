<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head>
	<title>Coelo</title>
	<meta name="description" content="Link de autoagendamento. Rápido. Simples." />
</svelte:head>

<Toaster
	richColors
	closeButton
	position="bottom-center"
	toastOptions={{
		class: 'border-border/50 bg-background shadow-lg font-sans'
	}}
/>

{@render children()}

<style>
	/* Lógica Mobile (max-width: 479px) */
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
		}

		:global([data-sonner-toast][data-removed='true']) {
			transform: translateX(100%) !important;
			opacity: 0;
			transition:
				transform 0.4s ease-in,
				opacity 0.2s ease-in !important;
		}
	}
</style>
