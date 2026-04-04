<script lang="ts" module>
	const user = {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg'
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
	import { SvelteURL } from 'svelte/reactivity';

	import DatePicker from './date-picker.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import type { ComponentProps } from 'svelte';
	import NavMain from './nav-main.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const selectedDate = $derived.by(() => {
		const d = page.url.searchParams.get('date');
		try {
			return d ? parseDate(d) : today(getLocalTimeZone());
		} catch {
			return today(getLocalTimeZone());
		}
	});

	function handleDateChange(date: any) {
		if (!date) return;

		const newUrl = new SvelteURL(page.url);

		if (newUrl.pathname !== '/agenda') {
			newUrl.pathname = '/agenda';
		}

		newUrl.searchParams.set('date', date.toString());

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(newUrl.toString(), { keepFocus: true, noScroll: true, replaceState: true });
	}
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Header class="h-16 border-b border-sidebar-border">
		<NavUser {user} />
	</Sidebar.Header>
	<Sidebar.Content>
		<DatePicker value={selectedDate} onValueChange={handleDateChange} />
		<Sidebar.Separator class="mx-0" />
		<NavMain />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
