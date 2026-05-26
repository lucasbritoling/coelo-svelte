<script>
	import { LogOut, LoaderCircle } from '@lucide/svelte';

	let confirmLogout = $state(false);
	let isLoggingOut = $state(false);

	$effect(() => {
		if (confirmLogout && !isLoggingOut) {
			const timer = setTimeout(() => (confirmLogout = false), 2500);
			return () => clearTimeout(timer);
		}
	});
</script>

<form method="POST" action="/logout" onsubmit={() => (isLoggingOut = true)}>
	<button
		type={confirmLogout ? 'submit' : 'button'}
		onclick={(e) => {
			if (!confirmLogout) {
				e.preventDefault();
				confirmLogout = true;
			}
		}}
		class="group flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-all active:bg-zinc-50/70 {confirmLogout
			? 'bg-red-50/40'
			: ''}"
	>
		<div
			class="flex size-9 shrink-0 items-center justify-center rounded-xl transition-all {confirmLogout
				? 'bg-red-100/70 text-red-600'
				: 'bg-zinc-100/80 text-zinc-500 group-hover:bg-zinc-100 group-hover:text-zinc-800'}"
		>
			{#if isLoggingOut}
				<LoaderCircle class="size-4.5 animate-spin text-red-600" />
			{:else}
				<LogOut class="size-4.5" />
			{/if}
		</div>

		<p
			class="text-[14.5px] font-medium tracking-tight text-zinc-700 transition-colors {confirmLogout
				? 'font-semibold text-red-600'
				: 'group-hover:text-zinc-900'}"
		>
			{#if isLoggingOut}
				Saindo...
			{:else if confirmLogout}
				Confirmar saída?
			{:else}
				Sair da conta
			{/if}
		</p>
	</button>
</form>
