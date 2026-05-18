<script lang="ts">
	import type { Appointment } from '$lib/types/appointment';
	import { MessageCircle, User } from '@lucide/svelte';
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
		onReschedule: (appt: Appointment) => void;
	}

	let {
		appt,
		onReschedule,
		showServiceColor,
		soon = null,
		currentTime,
		selectedDate,
		timezone
	}: Props = $props();

	let isExpanded = $state(false);

	// ── ESTADO OTIMISTA CENTRALIZADO ─────────────────────────────────
	let optimisticStatus = $state(appt.status);

	// Mantém sincronizado caso a prop mude de fora (mudança de página, etc)
	$effect(() => {
		optimisticStatus = appt.status;
	});
	// ─────────────────────────────────────────────────────────────────

	const STATUS_MAP: Record<string, { label: string; type: string }> = {
		pending: { label: 'Pendente', type: 'pending' },
		confirmed: { label: 'Confirmado', type: 'confirmed' },
		cancelled: { label: 'Cancelado', type: 'cancelled' },
		concluído: { label: 'Concluído', type: 'completed' },
		faltou: { label: 'Não compareceu', type: 'no-show' }
	};

	// Computações baseadas estritamente no estado otimista para refletir o clique na hora
	const currentStatus = $derived(STATUS_MAP[optimisticStatus]);

	const categoryStyle = $derived.by(() => {
		const color = appt.service_color || 'zinc';
		return color.startsWith('#')
			? { style: `background-color: ${color}`, class: '' }
			: { style: '', class: `bg-${color}-500` };
	});

	const isPast = $derived.by(() => {
		if (['cancelled', 'concluído', 'faltou'].includes(optimisticStatus)) return true;
		const todayStr = dateUtils.today(timezone);
		if (selectedDate < todayStr) return true;
		if (selectedDate > todayStr) return false;
		return currentTime > dateUtils.parseTimeToMs(appt.end_at, selectedDate, timezone);
	});

	const isCancelled = $derived(optimisticStatus === 'cancelled');

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
			<!-- O badge agora renderiza dinamicamente baseado no status otimista alterado na hora -->
			{#if currentStatus.type === 'pending' || currentStatus.type === 'confirmed' || currentStatus.type === 'cancelled'}
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

					<!-- Passando a função de modificação otimista para o Action -->
					<AppointmentItemAction
						{appt}
						onReschedule={() => onReschedule(appt)}
						onStatusChange={(newStatus) => (optimisticStatus = newStatus)}
					/>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Seus estilos CSS permanecem exatamente idênticos */
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
		opacity: 0.6;
	}

	.appt-card {
		display: flex;
		align-items: center;
		min-height: 40px;
	}

	.service-bar {
		width: 3px;
		align-self: stretch;
		margin: 6px 0 6px 8px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.time-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		padding: 0 14px;
		min-width: 70px;
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

	.sep {
		width: 1px;
		align-self: stretch;
		background: linear-gradient(to bottom, transparent, #e4e4e7 20%, #e4e4e7 80%, transparent);
		flex-shrink: 0;
	}

	.main-col {
		flex: 1;
		min-width: 0;
		padding: 0 14px;
		display: flex;
		align-items: center;
		gap: 10px;
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

	.right-col {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-left: 0px !important;
		padding: 0 12px;
		flex-shrink: 0;
	}

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
		background: #fffbeb;
		color: #d97706;
		border-color: #fde68a;
	}

	.status-badge[data-status='pending'] .badge-dot {
		background: #f59e0b;
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
