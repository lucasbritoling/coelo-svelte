<script lang="ts">
	import type { Appointment } from '$lib/types/appointment';
	import { MessageCircle, Settings2, User, ChevronDown } from '@lucide/svelte';
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

<div class="appt-wrapper" class:is-past={isPast} class:expanded={isExpanded} onclick={handleToggle}>
	<div class="appt-card">
		{#if showServiceColor}
			<div class="service-bar {categoryStyle.class}" style={categoryStyle.style}></div>
		{/if}

		<div class="time-col">
			<span class="time-start">{appt.start_at}</span>
			<span class="time-end">{appt.end_at}</span>
		</div>

		<div class="sep"></div>

		<div class="main-col">
			<div class="avatar-circle" class:cancelled={isCancelled}>
				<span>{initials}</span>
			</div>
			<div class="customer-block">
				<span class="customer-name" class:cancelled={isCancelled}>{appt.customer_name}</span>
				{#if appt.service_name}
					<span class="service-label">{appt.service_name}</span>
				{/if}
			</div>
		</div>

		<div class="right-col">
			{#if soon}
				<span class="soon-chip">{soon}</span>
			{/if}
			{#if currentStatus}
				<span class="status-badge" data-status={currentStatus.type}>
					<span class="badge-dot"></span>
					<span class="badge-text">{currentStatus.label}</span>
				</span>
			{/if}
			<div class="chevron-btn">
				<ChevronDown size={14} strokeWidth={2.5} class="chevron-icon" />
			</div>
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
		background: #111113;
		border: 1px solid #232326;
		border-radius: 14px;
		overflow: hidden;
		transition:
			border-color 0.15s,
			opacity 0.15s;
		user-select: none;
		margin-bottom: 8px;
		cursor: pointer;
	}
	.appt-wrapper:hover {
		border-color: #333336;
	}
	.appt-wrapper.is-past {
		opacity: 0.5;
	}
	.appt-card {
		display: flex;
		align-items: center;
		min-height: 56px;
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
		color: #e4e4e7;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}
	.time-end {
		font-size: 10px;
		color: #52525b;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	/* ── Separator ── */
	.sep {
		width: 1px;
		align-self: stretch;
		background: linear-gradient(to bottom, transparent, #252528 20%, #252528 80%, transparent);
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
		background: #1c1c1f;
		border: 1px solid #2e2e32;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: border-color 0.15s;
	}
	.appt-wrapper:hover .avatar-circle {
		border-color: #3e3e44;
	}
	.avatar-circle.cancelled {
		opacity: 0.4;
	}
	.avatar-circle span {
		font-size: 11px;
		font-weight: 600;
		color: #d4d4d8;
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
		color: #e4e4e7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: capitalize;
	}
	.customer-name.cancelled {
		text-decoration: line-through;
		color: #52525b;
	}
	.service-label {
		font-size: 11px;
		color: #52525b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* ── Right col ── */
	.right-col {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 12px;
		flex-shrink: 0;
	}
	.soon-chip {
		font-size: 10px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 6px;
		background: rgba(133, 77, 14, 0.2);
		color: #f59e0b;
		border: 1px solid rgba(180, 83, 9, 0.25);
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
		background: rgba(30, 41, 59, 0.5);
		color: #60a5fa;
		border-color: rgba(59, 130, 246, 0.18);
	}
	.status-badge[data-status='pending'] .badge-dot {
		background: #3b82f6;
	}

	.status-badge[data-status='confirmed'] {
		background: rgba(20, 83, 45, 0.35);
		color: #4ade80;
		border-color: rgba(34, 197, 94, 0.18);
	}
	.status-badge[data-status='confirmed'] .badge-dot {
		background: #22c55e;
	}

	.status-badge[data-status='cancelled'] {
		background: rgba(76, 5, 25, 0.4);
		color: #f87171;
		border-color: rgba(239, 68, 68, 0.18);
	}
	.status-badge[data-status='cancelled'] .badge-dot {
		background: #ef4444;
	}

	.status-badge[data-status='completed'] {
		background: rgba(39, 39, 42, 0.6);
		color: #71717a;
		border-color: #28282c;
	}
	.status-badge[data-status='completed'] .badge-dot {
		background: #52525b;
	}

	.status-badge[data-status='no-show'] {
		background: rgba(120, 53, 15, 0.25);
		color: #fb923c;
		border-color: rgba(251, 146, 60, 0.15);
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
		color: #52525b;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.appt-wrapper:hover .chevron-btn {
		background: #1c1c1f;
		color: #a1a1aa;
	}
	:global(.chevron-icon) {
		transition: transform 0.22s ease;
	}
	.expanded .chevron-btn {
		color: #e4e4e7;
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
		border-top: 1px solid #1e1e21;
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
		border-bottom: 1px solid #1e1e21;
	}
	.drawer-icon-wrap {
		width: 28px;
		height: 28px;
		background: #1c1c1f;
		border: 1px solid #252528;
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
		color: #d4d4d8;
		text-transform: capitalize;
	}
	.drawer-phone {
		font-size: 11px;
		color: #52525b;
		font-variant-numeric: tabular-nums;
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
		border-color: #252528 !important;
		background: transparent !important;
		color: #71717a !important;
		font-size: 12px !important;
		gap: 7px !important;
		transition: all 0.15s !important;
	}
	:global(.whatsapp-btn:hover) {
		border-color: rgba(34, 197, 94, 0.25) !important;
		background: rgba(34, 197, 94, 0.08) !important;
		color: #22c55e !important;
	}
</style>
