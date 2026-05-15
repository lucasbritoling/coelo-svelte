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
		currentTime: number;
		selectedDate: string;
	}

	let { appt, showServiceColor, soon = null, currentTime, selectedDate }: Props = $props();

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

		const today = new Date(currentTime);
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		if (selectedDate < todayStr) return true;
		if (selectedDate > todayStr) return false;

		return currentTime > dateUtils.parseTimeToMs(appt.end_at, currentTime);
	});
</script>

<!-- ── SNIPPETS (Blocos isolados de UI) ────────────────────────── -->
{#snippet timeBlock(start: string, end: string)}
	<div class="time-container">
		<span class="time-start">{start}</span>
		<span class="time-end">{end}</span>
	</div>
{/snippet}

{#snippet statusBadge(status: typeof currentStatus)}
	{#if status}
		<Badge class="status-badge" style="background: {status.bg}; color: {status.text}">
			{#if status.icon}<status.icon size={10} strokeWidth={3} />{/if}
			<span class="hidden xs:inline">{status.label}</span>
		</Badge>
	{/if}
{/snippet}

{#snippet whatsappButton(phone: string)}
	<a href="https://wa.me/{phone.replace(/\D/g, '')}" target="_blank" class="whatsapp-link">
		<MessageCircle size={15} />
	</a>
{/snippet}

<!-- ── ESTRUTURA PRINCIPAL ────────────────────────────────────── -->
<div class="group appointment-card" class:is-past={isPast}>
	{#if showServiceColor}
		<div class="service-indicator {categoryStyle.class}" style={categoryStyle.style}></div>
	{/if}

	{@render timeBlock(appt.start_at, appt.end_at)}

	<div class="min-w-0 flex-1">
		<p class="customer-name" class:cancelled={appt.status === 'cancelled'}>
			{appt.customer_name}
		</p>
	</div>

	<div class="right-container">
		{#if soon && appt.status !== 'cancelled' && !isPast}
			<span class="soon-label">
				{soon.replace('em ', '')}
			</span>
		{/if}

		{@render statusBadge(currentStatus)}

		<div class="actions-group">
			{#if appt.customer_phone && appt.status !== 'cancelled'}
				{@render whatsappButton(appt.customer_phone)}
			{/if}
			<AppointmentItemAction appointmentId={appt.id} appointmentStatus={appt.status} />
		</div>
	</div>
</div>

<!-- ── ESTILOS LOCAIS SEM RUÍDO ────────────────────────────────── -->
<style>
	.appointment-card :global(*) {
		/* Garante que seletores globais como componentes filhos herdem o comportamento esperado se necessário */
	}

	.appointment-card {
		display: flex;
		position: relative;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		border-radius: 0.75rem;
		border-width: 1px;
		--tw-border-opacity: 1;
		border-color: rgb(244 244 245 / var(--tw-border-opacity)); /* zinc-100 */
		background-color: hsl(var(--card));
		padding-left: 0.75rem;
		padding-right: 0.75rem;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	.appointment-card.is-past {
		opacity: 0.4;
		filter: grayscale(0.5);
	}

	.service-indicator {
		position: absolute;
		top: 0px;
		left: 0px;
		height: 100%;
		width: 0.25rem;
		border-top-left-radius: 0.75rem;
		border-bottom-left-radius: 0.75rem;
	}

	.time-container {
		display: flex;
		min-w: 45px;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-right-width: 1px;
		border-color: rgb(250 250 250); /* zinc-50 */
		padding-right: 0.5rem;
	}

	.time-start {
		font-size: 11px;
		line-height: 1.25;
		font-weight: 700;
		color: rgb(24 24 27); /* zinc-900 */
	}

	.time-end {
		font-size: 9px;
		line-height: 1.25;
		font-weight: 500;
		color: rgb(161 161 170); /* zinc-400 */
	}

	.customer-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.875rem;
		line-height: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.025em;
	}

	.customer-name.cancelled {
		text-decoration-line: line-through;
	}

	.right-container {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.375rem;
	}

	.soon-label {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		border-radius: 0.375rem;
		background-color: rgb(239 246 255); /* blue-50 */
		padding-left: 0.375rem;
		padding-right: 0.375rem;
		padding-top: 0.125rem;
		padding-bottom: 0.125rem;
		font-size: 9px;
		font-weight: 900;
		color: rgb(37 99 235); /* blue-600 */
	}

	:global(.status-badge) {
		display: flex !important;
		align-items: center !important;
		gap: 0.25rem !important;
		border-radius: 9999px !important;
		border-style: none !important;
		padding-left: 0.5rem !important;
		padding-right: 0.5rem !important;
		padding-top: 0.125rem !important;
		padding-bottom: 0.125rem !important;
		font-size: 9px !important;
		font-weight: 700 !important;
		white-space: nowrap !important;
		box-shadow: none !important;
	}

	.actions-group {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.whatsapp-link {
		display: flex;
		width: 2rem;
		height: 2rem;
		align-items: center;
		justify-content: center;
		color: rgb(161 161 170); /* zinc-400 */
	}

	@media (max-width: 340px) {
		.xs\:inline {
			display: none;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
