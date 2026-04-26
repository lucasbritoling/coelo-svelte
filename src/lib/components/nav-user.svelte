<script lang="ts">
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import BellIcon from '@lucide/svelte/icons/bell';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';

	let { ...restProps } = $props();
	const sidebar = useSidebar();
	const user = $derived(page.data.user);
</script>

<form action="/logout" method="POST" id="logout-form" style="display: none;"></form>

<Sidebar.Menu>
	{#if user}
		<Sidebar.MenuItem>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Sidebar.MenuButton
							{...props}
							size="lg"
							class="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
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
						</Sidebar.MenuButton>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
					side={sidebar.isMobile ? 'bottom' : 'right'}
					align="start"
					sideOffset={4}
				>
					<DropdownMenu.Label class="p-0 font-normal">
						<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
							<Avatar.Root class="size-8 rounded-lg">
								<Avatar.Image src={user.avatar} alt={user.full_name} />
								<Avatar.Fallback class="rounded-lg"
									>{user.full_name.slice(0, 2).toUpperCase()}</Avatar.Fallback
								>
							</Avatar.Root>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-medium">{user.full_name}</span>
								<span class="truncate text-xs">{user.email}</span>
							</div>
						</div>
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Item>
							<SparklesIcon />
							Seja Pro
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Item>
							<BadgeCheckIcon />
							Conta
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<CreditCardIcon />
							Assinatura
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<BellIcon />
							Notificações
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						onSelect={() => {
							const form = document.getElementById('logout-form') as HTMLFormElement;
							form?.submit();
						}}
					>
						<LogOutIcon />
						Sair
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</Sidebar.MenuItem>
	{/if}
</Sidebar.Menu>
