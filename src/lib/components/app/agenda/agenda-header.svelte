<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { Plus, Search, ChevronDown, Settings } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { navigating } from '$app/state';
	import { dateUtils } from '$lib/utils/date';

	let {
		headerLabel,
		selectedDate,
		user,
		timezone,
		ticker,
		onDateSelect,
		onOpenAppointment,
		onOpenSearch
	} = $props<{
		headerLabel: string;
		selectedDate: string;
		user: any;
		timezone: string;
		ticker: number;
		onDateSelect: (d: any) => void;
		onOpenAppointment: () => void;
		onOpenSearch: () => void;
	}>();

	const isToday = $derived(headerLabel.toLowerCase() === 'hoje');
	const currentTimeStr = $derived(dateUtils.toTime(ticker, timezone));

	function goToToday(e: MouseEvent) {
		e.stopPropagation();

		// Descobre o "hoje" real e seguro baseado no fuso geográfico correto
		const realTodayStr = dateUtils.today(timezone);

		onDateSelect(realTodayStr);
	}
</script>

<header
	class="sticky top-0 z-20 border-b border-transparent bg-background/80 backdrop-blur-xl transition-all"
	class:border-border={!ui.isDatePickerOpen}
	ontouchstart={(e) => e.stopPropagation()}
	ontouchend={(e) => e.stopPropagation()}
>
	<div class="relative flex items-center justify-between px-5 pt-6 pb-0">
		<button
			onclick={onOpenSearch}
			class="-ml-2 p-2 text-zinc-900 transition-transform active:scale-90"
		>
			<Search size={22} strokeWidth={2.5} />
		</button>

		<Dialog.Root bind:open={ui.isDatePickerOpen}>
			<Dialog.Trigger
				class="group absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 outline-none"
				onclick={() => {
					// Sincroniza a data atual no estado global antes de abrir
					ui.selectedDate = selectedDate;
				}}
			>
				<div class="flex flex-col items-center">
					<div class="flex items-center gap-1.5">
						<h1
							class="capitalize transition-opacity group-active:opacity-60 {navigating.to
								? 'opacity-40'
								: ''} 
                            {headerLabel.toLowerCase() === 'hoje'
								? 'text-[1.45rem] font-medium'
								: 'text-[1.15rem] font-semibold'}"
						>
							{headerLabel}
						</h1>
						<ChevronDown
							size={headerLabel.toLowerCase() === 'hoje' ? 22 : 18}
							strokeWidth={headerLabel.toLowerCase() === 'hoje' ? 2.5 : 2}
							class="mb-0.5 text-zinc-900 transition-transform group-active:translate-y-0.5
                            {headerLabel.toLowerCase() === 'hoje' ? 'mt-1' : 'mt-0.5'}"
						/>
						{#if isToday}
							<span
								class="mt-1 ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-500 shadow-sm"
							>
								{currentTimeStr}
							</span>
						{/if}
					</div>

					{#if headerLabel.toLowerCase() !== 'hoje'}
						<div class="mt-0.5 flex justify-center">
							<button
								onclick={goToToday}
								class="cursor-pointer text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase transition-colors hover:text-foreground"
							>
								Ir para hoje
							</button>
						</div>
					{/if}
				</div>
			</Dialog.Trigger>
		</Dialog.Root>

		<div class="flex items-center gap-1">
			<a href="/mais" class="relative mb-1 ml-1 size-9.5 transition-transform active:scale-90">
				<div
					class="flex size-full items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 shadow-sm"
				>
					{#if user?.avatar_url}
						<img src={user.avatar_url} alt="Perfil" class="h-full w-full object-cover" />
					{:else}
						<span class="text-[10px] font-bold uppercase">{user?.full_name?.charAt(0) ?? 'U'}</span>
					{/if}
				</div>
				<Settings
					size={10}
					strokeWidth={3}
					class="absolute -right-0.5 -bottom-0.5 text-zinc-600 drop-shadow-[0_0_2px_rgba(255,255,255,1)]"
				/>
			</a>
		</div>
	</div>
</header>
