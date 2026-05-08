<script lang="ts">
	import { page } from '$app/state';
	import { goto, preloadData } from '$app/navigation'; // Importações necessárias
	import { Calendar, Clock, UsersRound, BriefcaseBusiness } from '@lucide/svelte';

	const navItems = [
		{ title: 'Agenda', href: '/agenda', icon: Calendar },
		{ title: 'Horários', href: '/horarios', icon: Clock },
		{ title: 'Clientes', href: '/clientes', icon: UsersRound },
		{ title: 'Serviços', href: '/servicos', icon: BriefcaseBusiness }
	];
</script>

<nav
	class="
		z-50 flex shrink-0 items-stretch justify-around
		border-t bg-white
		pb-[env(safe-area-inset-bottom)]
		shadow-[0_-1px_0_0_rgba(0,0,0,0.08)]
		dark:bg-zinc-950
	"
>
	{#each navItems as item}
		{@const active = page.url.pathname === item.href}
		<button
			onclick={() => goto(item.href)}
			onmouseenter={() => preloadData(item.href)}
			ontouchstart={() => preloadData(item.href)}
			class="
				flex flex-1 flex-col items-center justify-center gap-1
				py-3 text-[11px] font-medium tracking-wide
				transition-all duration-75 active:scale-95
				{active ? 'text-primary' : 'text-muted-foreground'}
				appearance-none bg-transparent border-none outline-none
			"
		>
			<item.icon
				class="size-6 transition-transform duration-75 {active ? 'scale-110' : ''}"
				stroke-width={active ? 2.5 : 1.75}
			/>
			{item.title}
		</button>
	{/each}
</nav>
