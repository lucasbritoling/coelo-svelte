<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { DateValue } from '@internationalized/date';

	let {
		value = $bindable(),
		onValueChange
	}: {
		value: DateValue | undefined;
		onValueChange?: (d: DateValue | undefined) => void;
	} = $props();
</script>

<Sidebar.Group class="px-0">
	<Sidebar.GroupContent>
		<Calendar
			bind:value={value as any}
			{onValueChange}
			type="single"
			fixedWeeks
			preventDeselect={true}
			class="select-none [&_[data-bits-calendar-head-cell]]:w-[33px] [&_[role=gridcell]]:w-[33px] [&_[role=gridcell]_[data-selected]]:bg-sidebar-primary [&_[role=gridcell]_[data-selected]]:text-sidebar-primary-foreground
    [&_[role=gridcell]_[data-today]:not([data-selected])]:bg-sidebar-accent
    [&_[role=gridcell]_[data-today]:not([data-selected])]:font-bold
    [&_[role=gridcell]_[data-today]:not([data-selected])]:text-sidebar-accent-foreground"
		/>
	</Sidebar.GroupContent>
</Sidebar.Group>
