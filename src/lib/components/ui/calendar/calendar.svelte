<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import * as Calendar from './index.js';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import type { ButtonVariant } from '../button/button.svelte';
	import { getLocalTimeZone, isEqualMonth, today, type DateValue } from '@internationalized/date';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let {
		ref = $bindable(null),
		value = $bindable(),
		placeholder = $bindable(),
		preventDeselect = true,
		class: className,
		weekdayFormat = 'short',
		buttonVariant = 'ghost',
		captionLayout = 'label',
		locale = 'pt-BR',
		months: monthsProp,
		years,
		monthFormat: monthFormatProp,
		yearFormat = 'numeric',
		day,
		disableDaysOutsideMonth = false,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
		buttonVariant?: ButtonVariant;
		captionLayout?: 'dropdown' | 'dropdown-months' | 'dropdown-years' | 'label';
		months?: CalendarPrimitive.MonthSelectProps['months'];
		years?: CalendarPrimitive.YearSelectProps['years'];
		monthFormat?: CalendarPrimitive.MonthSelectProps['monthFormat'];
		yearFormat?: CalendarPrimitive.YearSelectProps['yearFormat'];
		day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
	} = $props();

	const monthFormat = $derived.by(() => {
		if (monthFormatProp) return monthFormatProp;
		if (captionLayout.startsWith('dropdown')) return 'short';
		return 'long';
	});

	// Lógica para o botão "Hoje" (mantida)
	const currentToday = today(getLocalTimeZone());

	const isNotCurrentMonth = $derived(
		placeholder &&
			(placeholder.month !== currentToday.month || placeholder.year !== currentToday.year)
	);

	async function goToToday() {
		// 1. Atualiza o visual do calendário imediatamente
		placeholder = currentToday;

		// 2. Formata a data para o padrão date=YYYY-MM-DD
		const formattedDate = currentToday.toString(); // Retorna "2026-05-10"

		const url = new URL(page.url);
		url.searchParams.set('date', formattedDate);

		// 3. Navega para a nova URL atualizando os dados do servidor
		await goto(url.toString(), {
			keepFocus: true,
			replaceState: true, // Mantém o histórico limpo
			noScroll: true
		});
	}
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={value as never}
	bind:ref
	bind:placeholder
	{preventDeselect}
	{weekdayFormat}
	{disableDaysOutsideMonth}
	class={cn(
		'group/calendar p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
		className
	)}
	{locale}
	{monthFormat}
	{yearFormat}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<Calendar.Months>
			<Calendar.Nav>
				<Calendar.PrevButton variant={buttonVariant} class="cursor-pointer" />
				<Calendar.NextButton variant={buttonVariant} class="cursor-pointer" />
			</Calendar.Nav>
			{#each months as month, monthIndex (month)}
				<Calendar.Month>
					<Calendar.Header class="h-auto flex-col gap-0 pt-1 pb-2 capitalize">
						<Calendar.Caption
							{captionLayout}
							months={monthsProp}
							{monthFormat}
							{years}
							{yearFormat}
							month={month.value}
							bind:placeholder
							{locale}
							{monthIndex}
							class="flex h-(--cell-size) items-center justify-center text-sm font-semibold"
						/>

						{#if isNotCurrentMonth}
							<div transition:fade={{ duration: 150 }} class="flex w-full justify-center">
								<button
									onclick={goToToday}
									class="mb-0 cursor-pointer pb-0 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase transition-colors hover:text-foreground"
								>
									Ir para hoje
								</button>
							</div>
						{/if}
					</Calendar.Header>
					<Calendar.Grid>
						<Calendar.GridHead>
							<Calendar.GridRow class="select-none">
								{#each weekdays as weekday (weekday)}
									<Calendar.HeadCell class="text-sm font-medium text-muted-foreground uppercase">
										{weekday.slice(0, 1)}
									</Calendar.HeadCell>
								{/each}
							</Calendar.GridRow>
						</Calendar.GridHead>
						<Calendar.GridBody>
							{#each month.weeks as weekDates (weekDates)}
								<Calendar.GridRow class="mt-2 w-full">
									{#each weekDates as date (date)}
										<Calendar.Cell {date} month={month.value} class="cursor-pointer">
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value)
												})}
											{:else}
												<Calendar.Day />
											{/if}
										</Calendar.Cell>
									{/each}
								</Calendar.GridRow>
							{/each}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar.Month>
			{/each}
		</Calendar.Months>
	{/snippet}
</CalendarPrimitive.Root>
