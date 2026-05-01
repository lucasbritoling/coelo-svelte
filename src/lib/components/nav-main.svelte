<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import { Calendar as CalendarIcon, UsersRound, BriefcaseBusiness, Clock } from '@lucide/svelte';

	const navItems = [
		{ title: 'Agenda', url: '/agenda', icon: CalendarIcon },
		{ title: 'Horários', url: '/horarios', icon: Clock },
		{ title: 'Clientes', url: '/clientes', icon: UsersRound },
		{ title: 'Serviços', url: '/servicos', icon: BriefcaseBusiness }
	];
</script>

<Sidebar.Group class="p-2">
	<Sidebar.Menu>
		{#each navItems as item (item.url)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					class="h-12 text-lg sm:h-9 sm:text-sm"
					isActive={page.url.pathname === item.url}
				>
					{#snippet child({ props })}
						<a href={item.url} {...props}>
							<item.icon class="!size-6 sm:!size-4" />
							<span>{item.title}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
