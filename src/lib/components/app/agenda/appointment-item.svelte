<script lang="ts">
	import type { Appointment } from '$lib/types/appointment';
	import { MessageCircle, CheckCircle2, XCircle, Clock, ChevronDown, User } from '@lucide/svelte';
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

	// Otimizado: Removidas strings longas de classes do JS. Mapeamos apenas semântica.
	const STATUS_MAP: Record<string, { label: string; variant: any; type: string; icon?: any }> = {
		pending: { label: 'Pendente', variant: 'outline', type: 'pending', icon: Clock },
		confirmed: { label: 'Confirmado', variant: 'outline', type: 'confirmed', icon: CheckCircle2 },
		cancelled: { label: 'Cancelado', variant: 'outline', type: 'cancelled', icon: XCircle },
		concluído: { label: 'Concluído', variant: 'secondary', type: 'completed', icon: CheckCircle2 },
		faltou: { label: 'Não compareceu', variant: 'destructive', type: 'no-show', icon: XCircle }
	};

	const currentStatus = $derived(STATUS_MAP[appt.status]);

	// Lógica de iniciais enxuta e direta
	const initials = $derived.by(() => {
		const name = appt.customer_name?.trim();
		if (!name) return '';
		const parts = name.split(/\s+/);
		return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
	});

	// Removido mapeamento estático inline para cores Tailwind comuns
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

	function handleToggle(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.drawer-actions, a, button')) return;
		isExpanded = !isExpanded;
	}
</script>

{#snippet timeBlock(start: string, end: string)}
	<div class="time-col">
		<span class="time-start">{start}</span>
		<span class="time-end">{end}</span>
	</div>
{/snippet}

<div class="appt-wrapper" class:is-past={isPast} class:expanded={isExpanded} onclick={handleToggle}>
	<div class="appt-card">
		{#if showServiceColor}
			<div class="service-bar {categoryStyle.class}" style={categoryStyle.style}></div>
		{/if}

		{@render timeBlock(appt.start_at, appt.end_at)}

		<div class="divider-line"></div>

		<div class="main-col">
			<div class="avatar-circle" class:cancelled={appt.status === 'cancelled'}>
				<span>{initials}</span>
			</div>
		</div>

		<div class="right-col">
			{#if soon && appt.status !== 'cancelled' && !isPast}
				<span class="soon-chip">{soon.includes('em') ? soon : `em ${soon}`}</span>
			{/if}

			{#if currentStatus}
				<!-- Otimizado: Estilização injetada via atributo data-status controlado pelo CSS scoped -->
				<Badge
					variant={currentStatus.variant}
					data-status={currentStatus.type}
					class="status-badge"
				>
					{#if currentStatus.icon}
						<span class="icon-wrapper">
							<currentStatus.icon size={13} strokeWidth={2.5} />
						</span>
					{/if}
					<span class="badge-text">{currentStatus.label}</span>
				</Badge>
			{/if}

			<div class="chevron-indicator">
				<ChevronDown size={16} class="chevron-icon" />
			</div>
		</div>
	</div>

	<div class="actions-drawer">
		<div class="drawer-content">
			<div class="customer-info-box">
				<User size={14} class="text-zinc-500" />
				<span class="drawer-customer-name" class:cancelled={appt.status === 'cancelled'}>
					{appt.customer_name}
				</span>
			</div>

			<div class="drawer-actions">
				<Button
					href="https://wa.me/{appt.customer_phone.replace(/\D/g, '')}"
					target="_blank"
					variant="outline"
					size="sm"
					class="whatsapp-btn"
					title="WhatsApp"
				>
					<MessageCircle size={15} />
					<span>Enviar Mensagem</span>
				</Button>

				<AppointmentItemAction appointmentId={appt.id} appointmentStatus={appt.status} />
			</div>
		</div>
	</div>
</div>

<style>
	/* Estilos base reaproveitados */
	.appt-wrapper {
		background: #121214;
		border: 1px solid #2d2d2d;
		border-radius: 12px;
		overflow: hidden;
		transition:
			border-color 0.15s,
			background-color 0.15s;
		user-select: none;
		margin-bottom: 8px;
	}
	.appt-wrapper:hover {
		border-color: #3e3e3e;
	}

	.appt-card {
		display: flex;
		align-items: center;
		min-height: 58px;
		padding: 8px 0;
	}

	.service-bar {
		width: 4px;
		align-self: stretch;
		margin: 2px 0 2px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.time-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		padding: 0 12px;
		min-width: 76px;
		flex-shrink: 0;
	}
	.time-start {
		font-size: 14px;
		font-weight: 600;
		color: #e4e4e7;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}
	.time-end {
		font-size: 11px;
		color: #71717a;
		line-height: 1.2;
	}

	.divider-line {
		width: 1px;
		align-self: stretch;
		background: #2d2d2d;
		flex-shrink: 0;
	}

	.main-col {
		flex: 1;
		min-width: 0;
		padding: 0 16px;
		display: flex;
		align-items: center;
	}

	.avatar-circle {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: #27272a;
		border: 1px solid #3f3f46;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.avatar-circle span {
		font-size: 12px;
		font-weight: 600;
		color: #f4f4f5;
		letter-spacing: 0.05em;
	}
	.avatar-circle.cancelled {
		background: #1c1917;
		border-color: #44403c;
		opacity: 0.5;
	}

	.right-col {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 12px;
		flex-shrink: 0;
	}

	.soon-chip {
		font-size: 11px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 999px;
		background: #854d0e2b;
		color: #f59e0b;
		border: 1px solid #b4530933;
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* OTIMIZAÇÃO: Centralização dos estilos dinâmicos do Badge via Atributos Data */
	:global(.status-badge) {
		font-weight: 500 !important;
		padding: 4px 10px !important;
		background-color: transparent !important;
		gap: 6px !important;
	}
	:global(.status-badge[data-status='pending']) {
		background-color: rgba(30, 41, 59, 0.4) !important;
		color: #60a5fa !important;
		border-color: rgba(59, 130, 246, 0.2) !important;
	}
	:global(.status-badge[data-status='confirmed']) {
		background-color: rgba(20, 83, 45, 0.3) !important;
		color: #4ade80 !important;
		border-color: rgba(34, 197, 94, 0.2) !important;
	}
	:global(.status-badge[data-status='cancelled']) {
		background-color: rgba(76, 5, 25, 0.4) !important;
		color: #f87171 !important;
		border-color: rgba(239, 68, 132, 0.2) !important;
	}
	:global(.status-badge[data-status='completed']) {
		background-color: rgba(39, 39, 42, 0.8) !important;
		color: #a1a1aa !important;
	}

	.badge-text {
		font-size: 12px;
		font-weight: 400;
	}

	.chevron-indicator {
		display: flex;
		align-items: center;
		color: #71717a;
		padding-left: 4px;
	}
	:global(.chevron-icon) {
		transition: transform 0.2s ease;
	}
	.appt-wrapper.expanded :global(.chevron-icon) {
		transform: rotate(180deg);
		color: #e4e4e7;
	}

	.actions-drawer {
		display: grid;
		grid-template-rows: 0fr;
		transition:
			grid-template-rows 0.2s ease-out,
			background-color 0.2s;
	}
	.appt-wrapper.expanded .actions-drawer {
		grid-template-rows: 1fr;
		background: #161619;
		border-top: 1px solid #2d2d2d;
	}
	.drawer-content {
		overflow: hidden;
		padding: 0 16px;
		transition: padding 0.2s ease-out;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.appt-wrapper.expanded .drawer-content {
		padding: 14px 16px;
	}

	.customer-info-box {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-bottom: 2px;
	}
	.drawer-customer-name {
		font-size: 14px;
		font-weight: 500;
		color: #e4e4e7;
		text-transform: capitalize;
	}
	.drawer-customer-name.cancelled {
		text-decoration: line-through;
		color: #52525b;
	}

	.drawer-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	:global(.whatsapp-btn) {
		border-radius: 8px !important;
		height: 36px !important;
		border-color: #2d2d2d !important;
		background-color: transparent !important;
		color: #a1a1aa !important;
		gap: 8px !important;
	}
	:global(.whatsapp-btn:hover) {
		border-color: rgba(34, 197, 94, 0.2) !important;
		background-color: rgba(34, 197, 94, 0.1) !important;
		color: #22c55e !important;
	}
</style>
