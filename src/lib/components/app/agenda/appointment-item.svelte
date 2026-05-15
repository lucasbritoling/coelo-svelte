<script lang="ts">
	import type { Appointment, AppointmentStatus } from '$lib/types/appointment';
	import { MessageCircle, CheckCircle2, XCircle } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import AppointmentItemAction from '$lib/components/app/agenda/appointment-item-action.svelte';

	interface Props {
		appt: Appointment;
		highlighted?: boolean;
		dimmed?: boolean;
		soon?: string | null;
	}

	let { appt, highlighted = false, dimmed = false, soon = null }: Props = $props();

	// Mapeamento de cores da Lib/Banco para Tailwind
	const serviceColorMap: Record<string, string> = {
		zinc: 'bg-zinc-500',
		blue: 'bg-blue-500',
		indigo: 'bg-indigo-500',
		violet: 'bg-violet-500',
		rose: 'bg-rose-500',
		amber: 'bg-amber-500',
		emerald: 'bg-emerald-500'
	};

	const STATUS: Record<string, { label: string; bg: string; text: string; icon?: any }> = {
		pending: { label: 'pendente', bg: '#FAEEDA', text: '#854F0B' },
		confirmed: { label: 'confirmado', bg: '#EAF3DE', text: '#3B6D11' },
		cancelled: { label: 'cancelado', bg: '#FEE2E2', text: '#991B1B' },
		concluído: { label: 'concluído', bg: '#F4F4F5', text: '#71717A', icon: CheckCircle2 },
		faltou: { label: 'não compareceu', bg: '#FEF2F2', text: '#991B1B', icon: XCircle }
	};

	const currentStatus = $derived(STATUS[appt.status]);
	// Cor do serviço vinda do banco (default blue se não houver)
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
</script>

<div
	class="group relative flex gap-4 rounded-[30px] border bg-card px-5 py-5 transition-all active:scale-[0.985]
    {highlighted ? 'border-zinc-200 shadow-md ring-1 ring-black/5' : 'border-zinc-100'}
    {dimmed ? 'scale-[0.98] opacity-50 grayscale-[0.5]' : 'opacity-100'}"
>
	<div
		class="absolute top-1/2 left-0 h-8 w-1.5 -translate-y-1/2 rounded-r-full {categoryStyle.class}"
		style={categoryStyle.style}
	></div>

	<div class="flex min-w-[52px] flex-col items-center pt-0.5">
		<span class="text-[15px] font-bold tabular-nums {dimmed ? 'text-zinc-400' : 'text-zinc-900'}">
			{appt.start_at}
		</span>
		<div class="my-2 w-px flex-1 bg-zinc-100" style="min-height:20px"></div>
		<span class="text-[12px] text-zinc-400 tabular-nums">{appt.end_at}</span>
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p
					class="truncate text-[17px] leading-tight font-bold {dimmed
						? 'text-zinc-500'
						: 'text-zinc-900'}"
				>
					{appt.customer_name}
				</p>
				<div class="mt-1 flex items-center gap-1.5">
					<p class="text-[13px] text-zinc-500">{appt.service_name}</p>
				</div>
			</div>

			<AppointmentItemAction appointmentId={appt.id} appointmentStatus={appt.status} />
		</div>

		<div class="mt-4 flex items-center gap-2">
			{#if soon && !dimmed}
				<span
					class="animate-pulse rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600"
				>
					{soon}
				</span>
			{/if}

			{#if currentStatus}
				<Badge
					class="flex items-center gap-1 rounded-full border-none px-3 py-1 text-[11px] font-bold"
					style="background:{currentStatus.bg}; color:{currentStatus.text}"
				>
					{#if currentStatus.icon}
						<currentStatus.icon size={12} strokeWidth={3} />
					{/if}
					{currentStatus.label}
				</Badge>
			{/if}

			{#if appt.customer_phone && appt.status !== 'cancelled'}
				<a
					href="https://wa.me/{appt.customer_phone.replace(/\D/g, '')}"
					target="_blank"
					class="ml-auto flex size-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition-colors hover:bg-green-50 hover:text-green-600 active:scale-90"
				>
					<MessageCircle size={18} />
				</a>
			{/if}
		</div>
	</div>
</div>
