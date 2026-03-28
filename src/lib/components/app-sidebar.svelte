<script lang="ts" module>
	const user = {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg'
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { today, getLocalTimeZone, CalendarDate, parseDate } from '@internationalized/date';
	import DatePicker from './date-picker.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import NavMain from './nav-main.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const dateParam = $derived(page.url.searchParams.get('date'));

	let hoje = today(getLocalTimeZone());

	let selectedDate = $state(dateParam ? parseDate(dateParam) : hoje);

	function handleDateChange(date: any) {
		if (!date) return;
		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', date.toString());
		goto(newUrl.toString(), { keepFocus: true, noScroll: true });
	}
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Header class="h-16 border-b border-sidebar-border">
		<NavUser {user} />
	</Sidebar.Header>
	<Sidebar.Content>
		<DatePicker bind:value={selectedDate} onValueChange={handleDateChange} />
		<Sidebar.Separator class="mx-0" />
		<NavMain />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
