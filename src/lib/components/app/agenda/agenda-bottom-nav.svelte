<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Calendar, UsersRound } from '@lucide/svelte';

	const navItems = [
		{ title: 'Agenda', href: '/agenda', icon: Calendar },
		{ title: 'Clientes', href: '/clientes', icon: UsersRound }
	];

	function navigateTo(href: string) {
		if (page.url.pathname === href) return;
		goto(href, {
			replaceState: true,
			noScroll: true
		});
	}
</script>

<div class="pointer-events-none fixed right-0 bottom-6 left-0 z-50 flex justify-center px-6">
	<nav
		class="pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-white/80 p-2 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/80"
	>
		{#each navItems as item}
			{@const active = page.url.pathname === item.href}
			<button
				onclick={() => navigateTo(item.href)}
				class={[
					'flex items-center gap-2.5 rounded-full px-5 py-2.5 transition-all duration-300 active:scale-95',
					active ? 'bg-[#E2E4F3] text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
				]}
			>
				<item.icon
					size={20}
					strokeWidth={active ? 2.8 : 2}
					fill="none"
					class={{ 'opacity-100': active, 'opacity-90': !active }}
				/>

				<span class="text-[15px] font-bold tracking-tight">
					{item.title}
				</span>
			</button>
		{/each}
	</nav>
</div>
