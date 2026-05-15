<script lang="ts">
	import type { Appointment } from '$lib/types/appointment';
	import { MessageCircle, CheckCircle2, XCircle } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import AppointmentItemAction from '$lib/components/app/agenda/appointment-item-action.svelte';
	import { dateUtils } from '$lib/utils/date';

	interface Props {
		appt: Appointment;
		showServiceColor: boolean;
		soon?: string | null;
		currentTime: number; // Ticker vindo do pai
	}

	let { appt, showServiceColor, soon = null, currentTime }: Props = $props();

	// Verifica se o agendamento já terminou baseado no ticker
	//const isPast = $derived.by(() => {
	//	const [hours, minutes] = appt.end_at.split(':').map(Number);
	//		const endAtDate = new Date(currentTime);
	//		endAtDate.setHours(hours, minutes, 0, 0);
	//		return currentTime > endAtDate.getTime();
	//	});

	const STATUS: Record<string, { label: string; bg: string; text: string; icon?: any }> = {
		pending: { label: 'pendente', bg: '#FDE68A', text: '#78350F' },
		confirmed: { label: 'confirmado', bg: '#D1FAE5', text: '#065F46' },
		cancelled: { label: 'cancelado', bg: '#FECACA', text: '#991B1B' },
		concluído: { label: 'concluído', bg: '#E4E4E7', text: '#3F3F46', icon: CheckCircle2 },
		faltou: { label: 'não compareceu', bg: '#FEE2E2', text: '#991B1B', icon: XCircle }
	};

	const currentStatus = $derived(STATUS[appt.status]);

	const categoryStyle = $derived.by(() => {
		const color = appt.service_color || 'zinc';
		if (color.startsWith('#')) return { style: `background-color: ${color}`, class: '' };
		const tailwindMap: Record<string, string> = {
			zinc: 'bg-zinc-500',
			blue: 'bg-blue-500',
			indigo: 'bg-indigo-500',
			violet: 'bg-violet-500',
			rose: 'bg-rose-500',
			amber: 'bg-amber-500',
			emerald: 'bg-emerald-500'
		};
		return { style: '', class: tailwindMap[color] || 'bg-zinc-500' };
	});
	const isPast = $derived.by(() => {
		if (appt.status === 'cancelled') return true;
		const endMs = dateUtils.parseTimeToMs(appt.end_at, currentTime);
		return currentTime > endMs;
	});
</script>

<div
	class="group relative flex items-center justify-between gap-2 rounded-xl border border-zinc-100 bg-card px-3 py-2 transition-all"
	class:opacity-40={isPast}
	class:grayscale-[0.5]={isPast}
>
	{#if showServiceColor}
		<div
			class="absolute top-0 left-0 h-full w-1 rounded-l-xl {categoryStyle.class}"
			style={categoryStyle.style}
		></div>
	{/if}

	<div class="flex min-w-[45px] flex-col items-center justify-center border-r border-zinc-50 pr-2">
		<span class="text-[11px] leading-tight font-bold text-zinc-900">{appt.start_at}</span>
		<span class="text-[9px] leading-tight font-medium text-zinc-400">{appt.end_at}</span>
	</div>

	<div class="min-w-0 flex-1">
		<p
			class="truncate text-sm font-semibold tracking-tight"
			class:line-through={appt.status === 'cancelled'}
		>
			{appt.customer_name}
		</p>
	</div>

	<div class="flex shrink-0 items-center gap-1.5">
		{#if soon && appt.status !== 'cancelled' && !isPast}
			<span
				class="animate-pulse rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-black text-blue-600"
			>
				{soon.replace('em ', '')}
			</span>
		{/if}

		{#if currentStatus}
			<Badge
				class="flex items-center gap-1 rounded-full border-none px-2 py-0.5 text-[9px] font-bold whitespace-nowrap shadow-none"
				style="background: {currentStatus.bg}; color: {currentStatus.text}"
			>
				{#if currentStatus.icon}
					<currentStatus.icon size={10} strokeWidth={3} />
				{/if}
				<span class="hidden xs:inline">{currentStatus.label}</span>
			</Badge>
		{/if}

		<div class="flex items-center gap-0.5">
			{#if appt.customer_phone && appt.status !== 'cancelled'}
				<a
					href="https://wa.me/{appt.customer_phone.replace(/\D/g, '')}"
					target="_blank"
					class="flex size-8 items-center justify-center text-zinc-400"
				>
					<MessageCircle size={15} />
				</a>
			{/if}
			<AppointmentItemAction appointmentId={appt.id} appointmentStatus={appt.status} />
		</div>
	</div>
</div>

<style>
	@media (max-width: 340px) {
		.xs\:inline {
			display: none;
		}
	}
</style>
