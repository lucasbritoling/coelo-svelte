<script lang="ts">
	import type { Appointment } from '$lib/types/appointment';
	import { MessageCircle, Settings2, User, ChevronDown, Sparkles } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import AppointmentItemAction from '$lib/components/app/agenda/appointment-item-action.svelte';
	import { dateUtils } from '$lib/utils/date';

	interface Props {
		appt: Appointment;
		showServiceColor: boolean; // Controla apenas a exibição do texto/badge do serviço agora
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

	let isExpanded = $state(false);

	const STATUS_MAP: Record<string, { label: string; type: string }> = {
		pending: { label: 'Pendente', type: 'pending' },
		confirmed: { label: 'Confirmado', type: 'confirmed' },
		cancelled: { label: 'Cancelado', type: 'cancelled' },
		concluído: { label: 'Concluído', type: 'completed' },
		faltou: { label: 'Não compareceu', type: 'no-show' }
	};

	const currentStatus = $derived(STATUS_MAP[appt.status]);

	const initials = $derived.by(() => {
		const name = appt.customer_name?.trim();
		if (!name) return '';
		const parts = name.split(/\s+/);
		return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
	});

	const categoryStyle = $derived.by(() => {
		const color = appt.service_color || 'zinc';
		return color.startsWith('#')
			? { style: `background-color: ${color}`, class: '' }
			: { style: '', class: `bg-${color}-500` };
	});

	const isPast = $derived.by(() => {
		if (['cancelled', 'concluído', 'faltou'].includes(appt.status)) return true;
		const todayStr = dateUtils.today(timezone);
		if (selectedDate < todayStr) return true;
		if (selectedDate > todayStr) return false;
		return currentTime > dateUtils.parseTimeToMs(appt.end_at, selectedDate, timezone);
	});

	const isCancelled = $derived(appt.status === 'cancelled');

	function handleToggle(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.drawer-actions, a, button')) return;
		isExpanded = !isExpanded;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="appt-wrapper"
	class:is-past={isPast}
	class:is-cancelled={isCancelled}
	class:expanded={isExpanded}
	onclick={handleToggle}
>
	<div class="appt-card">
		<!-- Removido o IF: A barra lateral de cor agora renderiza SEMPRE -->
		<div class="service-bar {categoryStyle.class}" style={categoryStyle.style}></div>

		<div class="time-col">
			<span class="time-start">{appt.start_at}</span>
		</div>

		<div class="sep"></div>

		<div class="main-col">
			<div class="customer-block">
				<span class="customer-name" class:cancelled={isCancelled}>{appt.customer_name}</span>
			</div>
		</div>

		<div class="right-col">
			{#if currentStatus.type === 'pending'}
				<span class="status-badge" data-status={currentStatus.type}>
					<span class="badge-dot"></span>
					<span class="badge-text">{currentStatus.label}</span>
				</span>
			{/if}
		</div>
	</div>

	<div class="actions-drawer">
		<div class="drawer-inner">
			<div class="drawer-body">
				<div class="drawer-header">
					<div class="drawer-icon-wrap">
						<User size={13} strokeWidth={2} />
					</div>
					<div class="drawer-meta">
						<span class="drawer-customer-name">{appt.customer_name}</span>
						{#if appt.customer_phone}
							<span class="drawer-phone">{appt.customer_phone}</span>
						{/if}
					</div>

					<!-- O nome do serviço é ocultado se houver apenas 1 serviço ativo -->
					{#if appt.service_name}
						<div class="drawer-service-badge" class:hidden={!showServiceColor}>
							<Sparkles size={11} class="text-zinc-400" />
							<span>{appt.service_name}</span>
						</div>
					{/if}
				</div>
				<div class="drawer-actions">
					<Button
						href="https://wa.me/{appt.customer_phone?.replace(/\D/g, '')}"
						target="_blank"
						variant="outline"
						size="sm"
						class="whatsapp-btn"
						title="WhatsApp"
					>
						<MessageCircle size={14} />
						<span>Enviar Mensagem</span>
					</Button>
					<AppointmentItemAction appointmentId={appt.id} appointmentStatus={appt.status} />
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.appt-wrapper {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 14px;
		overflow: hidden;
		transition:
			border-color 0.15s,
			box-shadow 0.15s,
			opacity 0.15s;
		user-select: none;
		margin-bottom: 8px;
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.appt-wrapper:hover {
		border-color: #d4d4d8;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	}

	.appt-wrapper.is-past {
		opacity: 1;
		filter: none;
	}

	.appt-wrapper.is-cancelled {
		opacity: 0.6; /* Ajuste o valor conforme preferir (ex: 0.5 para mais apagado) */
	}

	.appt-card {
		display: flex;
		align-items: center;
		min-height: 50px;
	}

	/* ── Service bar ── */
	.service-bar {
		width: 3px;
		align-self: stretch;
		margin: 6px 0 6px 8px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	/* ── Time ── */
	.time-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		padding: 0 14px;
		min-width: 80px;
		flex-shrink: 0;
	}

	.time-start {
		font-size: 13px;
		font-weight: 600;
		color: #18181b;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.time-end {
		font-size: 10px;
		color: #71717a;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	/* ── Separator ── */
	.sep {
		width: 1px;
		align-self: stretch;
		background: linear-gradient(to bottom, transparent, #e4e4e7 20%, #e4e4e7 80%, transparent);
		flex-shrink: 0;
	}

	/* ── Main col ── */
	.main-col {
		flex: 1;
		min-width: 0;
		padding: 0 14px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.avatar-circle {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #f4f4f5;
		border: 1px solid #e4e4e7;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: border-color 0.15s;
	}

	.appt-wrapper:hover .avatar-circle {
		border-color: #d4d4d8;
	}

	.avatar-circle.cancelled {
		opacity: 0.4;
	}

	.avatar-circle span {
		font-size: 11px;
		font-weight: 600;
		color: #3f3f46;
		letter-spacing: 0.06em;
	}

	.customer-block {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.customer-name {
		font-size: 13px;
		font-weight: 500;
		color: #18181b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: capitalize;
	}

	.customer-name.cancelled {
		text-decoration: line-through;
		opacity: 0.6;
	}

	/* ── Right col ── */
	.right-col {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-left: 0px !important;
		padding: 0 12px;
		flex-shrink: 0;
	}

	.soon-chip {
		font-size: 10px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 6px;
		background: #fffbeb;
		color: #d97706;
		border: 1px solid #fde68a;
		letter-spacing: 0.03em;
	}

	/* ── Status badge ── */
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 8px;
		font-size: 11px;
		font-weight: 500;
		border: 1px solid transparent;
		white-space: nowrap;
	}

	.badge-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-badge[data-status='pending'] {
		background: #fffbeb; /* Amarelo bem claro (amber-50) */
		color: #d97706; /* Texto amber escuro (amber-600) */
		border-color: #fde68a; /* Borda amber leve (amber-200) */
	}

	.status-badge[data-status='pending'] .badge-dot {
		background: #f59e0b; /* Bolinha amber sólida (amber-500) */
	}

	.status-badge[data-status='confirmed'] {
		background: #f0fdf4;
		color: #16a34a;
		border-color: #bbf7d0;
	}

	.status-badge[data-status='confirmed'] .badge-dot {
		background: #22c55e;
	}

	.status-badge[data-status='cancelled'] {
		background: #fef2f2;
		color: #dc2626;
		border-color: #fecaca;
	}

	.status-badge[data-status='cancelled'] .badge-dot {
		background: #ef4444;
	}

	.status-badge[data-status='completed'] {
		background: #f4f4f5;
		color: #71717a;
		border-color: #e4e4e7;
	}

	.status-badge[data-status='completed'] .badge-dot {
		background: #a1a1aa;
	}

	.status-badge[data-status='no-show'] {
		background: #fff7ed;
		color: #ea580c;
		border-color: #fed7aa;
	}

	.status-badge[data-status='no-show'] .badge-dot {
		background: #f97316;
	}

	.badge-text {
		font-size: 11px;
	}

	/* ── Chevron ── */
	.chevron-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		color: #a1a1aa;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.appt-wrapper:hover .chevron-btn {
		background: #f4f4f5;
		color: #52525b;
	}

	:global(.chevron-icon) {
		transition: transform 0.22s ease;
	}

	.expanded .chevron-btn {
		color: #18181b;
	}

	.expanded :global(.chevron-icon) {
		transform: rotate(180deg);
	}

	/* ── Drawer ── */
	.actions-drawer {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.22s ease-out;
	}

	.expanded .actions-drawer {
		grid-template-rows: 1fr;
		border-top: 1px solid #f1f5f9;
	}

	.drawer-inner {
		overflow: hidden;
	}

	.drawer-body {
		padding: 0 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		opacity: 0;
		transform: translateY(-4px);
		transition:
			opacity 0.18s ease-out 0.04s,
			transform 0.18s ease-out 0.04s,
			padding 0.22s ease-out;
	}

	.expanded .drawer-body {
		padding: 14px 14px 16px;
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Drawer header ── */
	.drawer-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding-bottom: 12px;
		border-bottom: 1px solid #f1f5f9;
	}

	.drawer-icon-wrap {
		width: 28px;
		height: 28px;
		background: #f4f4f5;
		border: 1px solid #e4e4e7;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #71717a;
	}

	.drawer-meta {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.drawer-customer-name {
		font-size: 13px;
		font-weight: 500;
		color: #18181b;
		text-transform: capitalize;
	}

	.drawer-phone {
		font-size: 11px;
		color: #71717a;
		font-variant-numeric: tabular-nums;
	}

	.drawer-service-badge {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		border-radius: 8px;
		background: #f4f4f5;
		border: 1px solid #e4e4e7;
		font-size: 11px;
		font-weight: 500;
		color: #3f3f46;
	}

	.drawer-service-badge.hidden {
		display: none;
	}

	/* ── Drawer actions ── */
	.drawer-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	:global(.whatsapp-btn) {
		height: 34px !important;
		padding: 0 14px !important;
		border-radius: 9px !important;
		border-color: #e4e4e7 !important;
		background: #ffffff !important;
		color: #52525b !important;
		font-size: 12px !important;
		gap: 7px !important;
		transition: all 0.15s !important;
	}

	:global(.whatsapp-btn:hover) {
		border-color: #86efac !important;
		background: #f0fdf4 !important;
		color: #16a34a !important;
	}
</style>
