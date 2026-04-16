<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Coelo</title>
	<meta name="description" content="Link de autoagendamento. Rápido. Simples." />
</svelte:head>

{@render children()}
