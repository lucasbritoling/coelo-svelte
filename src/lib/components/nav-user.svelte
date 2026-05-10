<script lang="ts">
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';

	let { ...restProps } = $props();
	const user = $derived(page.data.user);
</script>

<Sidebar.Menu>
	{#if user}
		<Sidebar.MenuItem>
			<!-- Trocamos o DropdownMenu por um link direto -->
			<Sidebar.MenuButton
				size="lg"
				class="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
			>
				{#snippet child({ props })}
					<a href="/mais" {...props}>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.avatar} alt={user.full_name} />
							<Avatar.Fallback class="rounded-lg">
								{user.full_name.slice(0, 2).toUpperCase()}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.full_name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDownIcon class="ms-auto size-4" />
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	{/if}
</Sidebar.Menu>
