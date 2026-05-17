<script lang="ts">
	import type { Appointment } from '$lib/types/appointment';
	import { MessageCircle, CheckCircle2, XCircle, Clock } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import AppointmentItemAction from '$lib/components/app/agenda/appointment-item-action.svelte';
	import { dateUtils } from '$lib/utils/date';

	interface Props {
		appt: Appointment;
		showServiceColor: boolean;
		soon?: string | null;
		currentTime: number;
		selectedDate: string;
		timezone: string;
	}

	let {
		appt,
		showServiceColor,
		soon = null,
		currentTime,
		selectedDate,
		timezone
	}: Props = $props();

	// Cores fiéis ao tema escuro (Dark Mode) do print enviado
	const STATUS: Record<string, { label: string; variant: any; class: string; icon?: any }> = {
		pending: {
			label: 'Pendente',
			variant: 'outline',
			class: 'bg-[#1e293b]/40 text-[#60a5fa] border-[#3b82f6]/20 font-medium px-2.5 py-1 gap-1.5',
			icon: Clock
		},
		confirmed: {
			label: 'Confirmado',
			variant: 'outline',
			class: 'bg-[#14532d]/30 text-[#4ade80] border-[#22c55e]/20 font-medium px-2.5 py-1 gap-1.5',
			icon: CheckCircle2
		},
		cancelled: {
			label: 'Cancelado',
			variant: 'outline',
			class: 'bg-[#4c0519]/40 text-[#f87171] border-[#ef4444]/20 font-medium px-2.5 py-1 gap-1.5',
			icon: XCircle
		},
		concluído: {
			label: 'Concluído',
			variant: 'secondary',
			class: 'bg-zinc-800/80 text-zinc-400 font-medium px-2.5 py-1',
			icon: CheckCircle2
		},
		faltou: {
			label: 'Não compareceu',
			variant: 'destructive',
			class: 'font-medium px-2.5 py-1',
			icon: XCircle
		}
	};

	const currentStatus = $derived(STATUS[appt.status]);

	const categoryStyle = $derived.by(() => {
		const color = appt.service_color || 'zinc';
		if (color.startsWith('#')) return { style: `background-color: ${color}`, class: '' };

		const tailwindMap: Record<string, string> = {
			zinc: 'bg-zinc-600',
			blue: 'bg-blue-500',
			indigo: 'bg-indigo-500',
			violet: 'bg-violet-500',
			rose: 'bg-rose-500',
			amber: 'bg-amber-500',
			emerald: 'bg-emerald-500'
		};
		return { style: '', class: tailwindMap[color] || 'bg-zinc-600' };
	});

	const isPast = $derived.by(() => {
		if (appt.status === 'cancelled') return true;
		if (appt.status === 'concluído' || appt.status === 'faltou') return true;

		const todayStr = dateUtils.today(timezone);

		if (selectedDate < todayStr) return true;
		if (selectedDate > todayStr) return false;

		const endMs = dateUtils.parseTimeToMs(appt.end_at, selectedDate, timezone);
		return currentTime > endMs;
	});
</script>

{#snippet timeBlock(start: string, end: string)}
	<div class="time-col">
		<span class="time-start">{start}</span>
		<span class="time-end">{end}</span>
	</div>
{/snippet}

<div class="appt-card" class:is-past={isPast}>
	{#if showServiceColor}
		<div class="service-bar {categoryStyle.class}" style={categoryStyle.style}></div>
	{/if}

	{@render timeBlock(appt.start_at, appt.end_at)}

	<div class="divider-line"></div>

	<div class="main-col">
		<p class="customer-name" class:cancelled={appt.status === 'cancelled'}>
			{appt.customer_name}
		</p>
	</div>

	<div class="right-col">
		{#if soon && appt.status !== 'cancelled' && !isPast}
			<span class="soon-chip">{soon.includes('em') ? soon : `em ${soon}`}</span>
		{/if}

		{#if currentStatus}
			<Badge variant={currentStatus.variant} class={currentStatus.class}>
				{#if currentStatus.icon}
					<span class="icon-wrapper">
						<currentStatus.icon size={13} strokeWidth={2.5} />
					</span>
				{/if}
				<span class="text-[12px] font-normal">{currentStatus.label}</span>
			</Badge>
		{/if}

		<div class="actions">
			{#if appt.customer_phone && appt.status !== 'cancelled'}
				<Button
					href="https://wa.me/{appt.customer_phone.replace(/\D/g, '')}"
					target="_blank"
					variant="outline"
					size="icon"
					class="whatsapp-btn h-8 w-8 border-[#2d2d2d] bg-transparent text-zinc-400 hover:border-[#22c55e]/20 hover:bg-[#22c55e]/10 hover:text-[#22c55e]"
					title="WhatsApp"
				>
					<MessageCircle size={15} />
				</Button>
			{/if}

			<AppointmentItemAction appointmentId={appt.id} appointmentStatus={appt.status} />
		</div>
	</div>
</div>

<style>
	.appt-card {
		display: flex;
		align-items: center;
		background: #1e1e1e; /* Fundo escuro idêntico ao do print */
		border: 1px solid #2d2d2d; /* Bordas suaves e escuras */
		border-radius: 12px;
		overflow: hidden;
		min-height: 64px;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.appt-card:hover {
		border-color: #3e3e3e;
		background: #232323;
	}

	/* Opacidade reduzida para itens no passado ou cancelados */
	.appt-card.is-past {
		opacity: 0.35;
	}

	/* Barra de cor lateral flutuante e arredondada */
	.service-bar {
		width: 4px;
		align-self: stretch;
		margin: 6px 0 6px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	/* Coluna de Horários */
	.time-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		padding: 0 16px;
		min-width: 80px;
		flex-shrink: 0;
	}
	.time-start {
		font-size: 14px;
		font-weight: 600;
		color: #e4e4e7; /* Texto claro */
		letter-spacing: -0.01em;
	}
	.time-end {
		font-size: 11px;
		color: #71717a; /* Texto secundário discreto */
	}

	/* Linha divisória interna */
	.divider-line {
		width: 1px;
		align-self: stretch;
		background: #2d2d2d;
		flex-shrink: 0;
		margin: 14px 0;
	}

	/* Nome do cliente */
	.main-col {
		flex: 1;
		min-width: 0;
		padding: 0 16px;
	}
	/* Nome do cliente modificado para permitir quebra de linha */
	.customer-name {
		font-size: 14px;
		font-weight: 500;
		color: #e4e4e7;
		/* Propriedades antigas de truncate removidas */
		word-break: break-word; /* Garante que strings gigantes sem espaço não quebrem o layout */
	}
	.customer-name.cancelled {
		text-decoration: line-through;
		color: #52525b;
	}

	/* Container do lado direito */
	.right-col {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 14px;
		flex-shrink: 0;
	}

	/* Chip do "em 5 min" no tom âmbar/ouro para fundo escuro */
	.soon-chip {
		font-size: 11px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 999px;
		background: #854d0e2b; /* Fundo dourado translúcido */
		color: #f59e0b;
		border: 1px solid #b4530933;
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	/* Força os botões de ação a manterem o visual arredondado do print */
	:global(.whatsapp-btn) {
		border-radius: 8px !important;
	}
</style>
