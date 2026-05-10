<script lang="ts">
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';

	let { ...restProps } = $props();

	// Pegamos os dados do usuário da store de página
	const user = $derived(page.data.user);

	// Lógica de iniciais idêntica à do seu componente de perfil
	const initials = $derived(
		user?.full_name
			?.split(' ')
			.map((n: string) => n[0])
			.slice(0, 1)
			.join('')
			.toUpperCase() || '?'
	);
</script>

<Sidebar.Menu>
	{#if user}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton
				size="lg"
				class="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
			>
				{#snippet child({ props })}
					<a href="/mais" {...props}>
						<Avatar.Root class="size-8 rounded-lg">
							<!-- Usamos avatar_url para bater com o banco/perfil -->
							<Avatar.Image
								src={user.avatar_url}
								alt={user.full_name}
								loading="lazy"
								decoding="async"
							/>
							<Avatar.Fallback class="rounded-lg bg-muted">
								{initials}
							</Avatar.Fallback>
						</Avatar.Root>

						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.full_name}</span>
							<span class="truncate text-xs text-muted-foreground">{user.email}</span>
						</div>

						<ChevronsUpDownIcon class="ms-auto size-4 text-muted-foreground/50" />
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	{/if}
</Sidebar.Menu>
