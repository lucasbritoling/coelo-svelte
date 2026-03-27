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
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { CalendarDate, parseDate } from '@internationalized/date';
	import DatePicker from './date-picker.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import NavMain from './nav-main.svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
	// 1. Pegamos a data da URL ou usamos a data de hoje como fallback
	const dateParam = $derived(page.url.searchParams.get('date'));

	// 2. Criamos um estado reativo que sincroniza com a URL
	let selectedDate = $state(dateParam ? parseDate(dateParam) : new CalendarDate(2026, 3, 27));

	// 3. Função para atualizar a URL quando a data mudar no calendário
	function handleDateChange(date: any) {
		if (!date) return;

		const newUrl = new URL(page.url);
		newUrl.searchParams.set('date', date.toString());

		// 'keepfocus' evita que o foco saia do calendário
		// 'noscroll' evita que a página pule para o topo
		goto(newUrl.toString(), { keepFocus: true, noScroll: true });
	}
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Header class="h-16 border-b border-sidebar-border">
		<NavUser user={data.user} />
	</Sidebar.Header>
	<Sidebar.Content>
		<DatePicker bind:value={selectedDate} onValueChange={handleDateChange} />
		<Sidebar.Separator class="mx-0" />
		<NavMain />
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
