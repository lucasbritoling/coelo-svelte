<script lang="ts" module>
	// This is sample data.
	const data = {
		user: {
			name: 'shadcn',
			email: 'm@example.com',
			avatar: '/avatars/shadcn.jpg'
		},
		calendars: [
			{
				name: 'My Calendars',
				items: ['Personal', 'Work', 'Family']
			},
			{
				name: 'Favorites',
				items: ['Holidays', 'Birthdays']
			},
			{
				name: 'Other',
				items: ['Travel', 'Reminders', 'Deadlines']
			}
		]
	};
</script>

<script lang="ts">
	import DatePicker from './date-picker.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { ComponentProps } from 'svelte';
	import NavMain from './nav-main.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Header class="h-16 border-b border-sidebar-border">
		<NavUser user={data.user} />
	</Sidebar.Header>
	<Sidebar.Content>
		<DatePicker />
		<Sidebar.Separator class="mx-0" />
		<NavMain />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
