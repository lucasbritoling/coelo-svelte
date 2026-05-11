<script lang="ts">
	import { page } from '$app/state';
	import { goto, preloadData } from '$app/navigation';
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
		class="
            pointer-events-auto flex items-center gap-2
            rounded-full border border-white/20
            bg-white/80 p-2 shadow-2xl backdrop-blur-xl
            dark:bg-zinc-900/80
        "
	>
		{#each navItems as item}
			{@const active = page.url.pathname === item.href}
			<button
				onclick={() => navigateTo(item.href)}
				onmouseenter={() => preloadData(item.href)}
				ontouchstart={() => preloadData(item.href)}
				class="
                    flex items-center gap-3 rounded-full px-6
                    py-3 transition-all duration-200 active:scale-90
                    {active
					? 'bg-zinc-900 text-white shadow-md'
					: 'text-zinc-500 hover:bg-zinc-100'}
                "
			>
				<item.icon size={20} stroke-width={active ? 2.5 : 2} />
				{#if active}
					<span class="text-sm font-bold tracking-tight">
						{item.title}
					</span>
				{/if}
			</button>
		{/each}
	</nav>
</div>
