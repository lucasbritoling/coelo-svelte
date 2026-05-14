<script lang="ts">
	import BottomNav from '$lib/components/app/agenda/agenda-bottom-nav.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import DatePicker from '$lib/components/date-picker.svelte';
	import { parseDate } from '@internationalized/date';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();

	function handleDateChange(date: any) {
		if (!date) return;

		const dateString = date.toString();

		// 1. Atualiza a fonte de verdade global
		ui.selectedDate = dateString;

		// 2. Se estiver na agenda, dispara a navegação
		if (page.url.pathname.includes('/agenda')) {
			const newUrl = new URL(page.url);
			newUrl.searchParams.set('date', dateString);
			goto(newUrl.search, { replaceState: true, noScroll: true });
		}

		// 3. Fecha o picker
		ui.isDatePickerOpen = false;
	}
</script>

<div class="flex h-svh w-full justify-center bg-zinc-100 dark:bg-black">
	<div
		class="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl"
	>
		<main class="flex-1 overflow-x-hidden overflow-y-auto pb-0">
			{@render children()}
		</main>

		<BottomNav />
	</div>
</div>

<Dialog.Root bind:open={ui.isDatePickerOpen}>
	<Dialog.Content
		class="fixed top-[50%] left-[50%] z-150 w-[92vw] max-w-xs translate-x-[-50%] translate-y-[-50%] rounded-[32px] border bg-background p-4 shadow-lg"
	>
		<DatePicker
			value={ui.selectedDate ? parseDate(ui.selectedDate) : undefined}
			onValueChange={handleDateChange}
		/>
	</Dialog.Content>
</Dialog.Root>
