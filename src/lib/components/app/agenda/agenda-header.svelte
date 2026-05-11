<script lang="ts">
	import { Plus, Search, ChevronDown, Settings } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import DatePicker from '$lib/components/date-picker.svelte';
	import { parseDate } from '@internationalized/date';
	import { navigating } from '$app/state';

	let { headerLabel, selectedDate, user, onDateSelect, onOpenAppointment, onOpenSearch } = $props<{
		headerLabel: string;
		selectedDate: string;
		user: any;
		onDateSelect: (d: any) => void;
		onOpenAppointment: () => void;
		onOpenSearch: () => void;
	}>();

	let isPickerOpen = $state(false);

	function handleDateChange(d: any) {
		onDateSelect(d);
		isPickerOpen = false;
	}
</script>

<header
	class="sticky top-0 z-20 border-b border-transparent bg-background/80 backdrop-blur-xl transition-colors"
	class:border-border={!isPickerOpen}
>
	<div class="flex items-center justify-between px-5 pt-6 pb-4">
		<button
			onclick={onOpenSearch}
			class="-ml-2 p-2 text-zinc-900 transition-transform active:scale-90"
		>
			<Search size={22} strokeWidth={2.5} />
		</button>

		<Dialog.Root bind:open={isPickerOpen}>
			<Dialog.Trigger class="group flex items-center gap-1">
				<h1
					class="text-[1.1rem] font-bold tracking-tight capitalize transition-opacity group-active:opacity-60"
					class:opacity-40={navigating.to}
				>
					{headerLabel}
				</h1>
				<ChevronDown size={16} class="text-zinc-400 transition-transform group-active:rotate-180" />
			</Dialog.Trigger>

			<Dialog.Content
				class="fixed top-[50%] left-[50%] z-50 w-[92vw] max-w-xs translate-x-[-50%] translate-y-[-50%] rounded-[32px] border bg-background p-4 shadow-lg"
			>
				<DatePicker value={parseDate(selectedDate)} onValueChange={handleDateChange} />
			</Dialog.Content>
		</Dialog.Root>

		<div class="flex items-center gap-2">
			<button
				onclick={onOpenAppointment}
				class="p-2 text-zinc-900 transition-transform active:scale-90"
			>
				<Plus size={26} strokeWidth={2.5} />
			</button>

			<a href="/mais" class="relative size-8 transition-transform active:scale-90">
				<div
					class="flex size-full items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 shadow-sm"
				>
					{#if user?.avatar_url}
						<img src={user.avatar_url} alt="Perfil" class="h-full w-full object-cover" />
					{:else}
						<span class="text-[10px] font-bold uppercase">{user?.full_name?.charAt(0) ?? 'U'}</span>
					{/if}
				</div>
				<div
					class="absolute -right-0.5 -bottom-0.5 flex size-3 items-center justify-center rounded-full bg-white shadow-xs"
				>
					<Settings size={8} class="text-zinc-600" />
				</div>
			</a>
		</div>
	</div>
</header>
