<script lang="ts">
	import type { Appointment } from '$lib/types/appointment';
	import { MessageCircle, CheckCircle2, XCircle, Clock, ChevronDown } from '@lucide/svelte';
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

	// Controle de expansão nativo do Svelte 5
	let isExpanded = $state(false);

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

	function handleToggle(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// Impede de fechar/abrir a alça se clicar diretamente nos botões internos da gaveta
		if (target.closest('.drawer-actions') || target.closest('a') || target.closest('button')) {
			return;
		}
		isExpanded = !isExpanded;
	}
</script>

{#snippet timeBlock(start: string, end: string)}
	<div class="time-col">
		<span class="time-start">{start}</span>
		<span class="time-end">{end}</span>
	</div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="appt-wrapper" class:is-past={isPast} class:expanded={isExpanded} onclick={handleToggle}>
	<div class="appt-card">
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

			<div class="chevron-indicator">
				<ChevronDown size={16} class="chevron-icon" />
			</div>
		</div>
	</div>

	<div class="actions-drawer">
		<div class="drawer-content">
			<div class="drawer-actions">
				{#if appt.customer_phone && appt.status !== 'cancelled'}
					<Button
						href="https://wa.me/{appt.customer_phone.replace(/\D/g, '')}"
						target="_blank"
						variant="outline"
						size="sm"
						class="whatsapp-btn gap-2 border-[#2d2d2d] bg-transparent text-zinc-400 hover:border-[#22c55e]/20 hover:bg-[#22c55e]/10 hover:text-[#22c55e]"
						title="WhatsApp"
					>
						<MessageCircle size={15} />
						<span>Enviar Mensagem</span>
					</Button>
				{/if}

				<AppointmentItemAction appointmentId={appt.id} appointmentStatus={appt.status} />
			</div>
		</div>
	</div>
</div>

<style>
	/* Wrapper principal que agrupa o card e a gaveta oculta */
	.appt-wrapper {
		background: #121214; /* Tema super escuro fiel ao print */
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

	/* Card superior - CORRIGIDO: Força alinhamento vertical central de todos os filhos */
	.appt-card {
		display: flex;
		align-items: center;
		min-height: 56px; /* Garante uma altura mínima consistente para o card */
		padding: 8px 0; /* Padding simétrico em cima e embaixo */
	}

	.appt-wrapper.is-past {
		opacity: 1;
	}

	.service-bar {
		width: 4px;
		align-self: stretch;
		margin: 2px 0 2px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	/* Coluna do Tempo - CORRIGIDO: Centralizado verticalmente */
	.time-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center; /* Centraliza conteúdo internamente */
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

	/* Coluna Principal (Nome) - CORRIGIDO: Centralizado verticalmente */
	.main-col {
		flex: 1;
		min-width: 0;
		padding: 0 12px;
		display: flex;
		flex-direction: column;
		justify-content: center; /* Garante centralização vertical */
	}

	.customer-name {
		font-size: 14px;
		font-weight: 500;
		color: #e4e4e7;
		line-height: 1.3;
		text-transform: capitalize;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.customer-name.cancelled {
		text-decoration: line-through;
		color: #52525b;
	}

	/* Coluna da Direita (Status e Chevron) - CORRIGIDO: Centralizado verticalmente */
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

	/* Seta do Chevron e sua animação de rotação */
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

	/* GAVETA RETRÁTIL DINÂMICA (Transição CSS Limpa) */
	.actions-drawer {
		display: grid;
		grid-template-rows: 0fr;
		transition:
			grid-template-rows 0.2s ease-out,
			background-color 0.2s;
		background: transparent;
	}
	.appt-wrapper.expanded .actions-drawer {
		grid-template-rows: 1fr;
		background: #161619; /* Leve distinção de fundo quando aberto */
		border-top: 1px solid #2d2d2d;
	}
	.drawer-content {
		overflow: hidden;
		padding: 0 16px;
		transition: padding 0.2s ease-out;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.appt-wrapper.expanded .drawer-content {
		padding: 12px 16px; /* Só aplica padding vertical quando expandido */
	}

	.drawer-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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
	}
</style>
