<script lang="ts">
	import type { Appointment, AppointmentStatus } from '$lib/types/appointment';
	import { MessageCircle } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import AppointmentCardAction from '$lib/components/app/appointment-card-action.svelte';

	interface Props {
		appt: Appointment;
		highlighted?: boolean;
		dimmed?: boolean;
		soon?: string | null;
	}

	let { appt, highlighted = false, dimmed = false, soon = null }: Props = $props();

	const STATUS: Record<AppointmentStatus, { label: string; bg: string; text: string }> = {
		confirmed: { label: 'confirmado', bg: '#EAF3DE', text: '#3B6D11' },
		pending: { label: 'pendente', bg: '#FAEEDA', text: '#854F0B' },
		cancelled: { label: 'cancelado', bg: '#FEE2E2', text: '#991B1B' }
	};
</script>

<div
	class="flex gap-4 rounded-[30px] border bg-card px-5 py-5 transition-all active:scale-[0.985]
    {highlighted ? 'border-zinc-200 shadow-md' : 'border-zinc-100'}"
	class:opacity-40={dimmed}
>
	<div class="flex min-w-[52px] flex-col items-center pt-0.5">
		<span class="text-[15px] font-bold tabular-nums">{appt.start_at}</span>
		<div class="my-2 w-px flex-1 bg-zinc-100" style="min-height:20px"></div>
		<span class="text-[12px] text-zinc-400 tabular-nums">{appt.end_at}</span>
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-[17px] leading-tight font-bold">{appt.customer_name}</p>
				<p class="mt-1 text-[13px] text-zinc-500">{appt.service_name}</p>
			</div>
			<AppointmentCardAction appointmentId={appt.id} appointmentStatus={appt.status} />
		</div>

		<div class="mt-4 flex items-center gap-2">
			{#if soon}
				<span class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600"
					>{soon}</span
				>
			{/if}
			{#if STATUS[appt.status]}
				<Badge
					class="rounded-full border-none px-3 py-1 text-[11px] font-bold"
					style="background:{STATUS[appt.status].bg}; color:{STATUS[appt.status].text}"
				>
					{STATUS[appt.status].label}
				</Badge>
			{/if}
			{#if appt.customer_phone}
				<a
					href="https://wa.me/{appt.customer_phone.replace(/\D/g, '')}"
					target="_blank"
					class="ml-auto text-zinc-400 active:opacity-50"
				>
					<MessageCircle size={18} />
				</a>
			{/if}
		</div>
	</div>
</div>
