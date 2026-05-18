<script lang="ts">
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CircleCheckBig,
		Calendar,
		Clock,
		User2,
		Share,
		ChevronLeft,
		Download,
		MapPin // <-- Adicionado o ícone de localização
	} from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';

	import { getLocalTimeZone } from '@internationalized/date';
	import { createFormatters, dateUtils } from '$lib/utils/date'; 

	let { data } = $props();
	const { appointment, professional } = data;

	let copied = $state(false);
	const firstName = $derived(appointment.customer_name.split(' ')[0]);

	const clientTz = getLocalTimeZone();
	const formatters = createFormatters(clientTz);

	const formattedTime = $derived(dateUtils.toTime(appointment.startMs, clientTz));

	const formattedDate = $derived(
		new Intl.DateTimeFormat('pt-BR', {
			timeZone: clientTz,
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).format(appointment.startMs)
	);

	const dayName = $derived(
		new Intl.DateTimeFormat('pt-BR', { timeZone: clientTz, weekday: 'long' })
			.format(appointment.startMs)
			.replace(/^\w/, (c) => c.toUpperCase())
	);

	async function handleShare() {
		// Opcional: Adicionado o endereço na mensagem de compartilhamento também se houver
		const addressInfo = professional.address ? ` em ${professional.address}` : '';
		const message = `${appointment.service_name} com ${professional.full_name} no dia ${formattedDate} (${dayName}) às ${formattedTime}${addressInfo}`;

		const shareData = {
			title: 'Meu Agendamento',
			text: message,
			url: window.location.href
		};

		if (navigator.share) {
			try {
				await navigator.share(shareData);
			} catch (err) {}
		} else {
			const fullText = `${shareData.title}: ${message}\n\nLink: ${window.location.href}`;
			await navigator.clipboard.writeText(fullText);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<svelte:head>
	<title>Confirmado • {appointment.service_name}</title>
	<meta property="og:title" content="Agendamento Confirmado ✅" />
	<meta
		property="og:description"
		content="{appointment.service_name} com {professional.full_name} em {formattedDate} às {formattedTime}."
	/>
	<meta property="og:image" content="{page.url.origin}/icon-300-squared.png?v=definitivo" />
	<meta property="og:image:width" content="298" />
	<meta property="og:image:height" content="298" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6 antialiased dark:bg-[#0a0a0a]"
>
	<div class="mb-8 flex w-full max-w-sm justify-start">
		<a
			href="/{professional.username}"
			class="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
		>
			<ChevronLeft class="size-4" />
			Nova reserva
		</a>
	</div>

	<main in:fly={{ y: 20, duration: 600 }} class="w-full max-w-sm">
		<div class="mb-6 text-center">
			<h2 class="text-2xl font-bold tracking-tight text-foreground">
				Tudo pronto, {firstName}!
			</h2>
			<p class="text-sm text-muted-foreground">Seu horário está garantido.</p>
		</div>

		<Card.Root
			class="!gap-0 overflow-hidden border-none bg-white !p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-[#111] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
		>
			<div
				class="flex flex-col items-center border-b border-emerald-100/20 bg-emerald-50/50 px-8 pt-12 pb-8 dark:bg-emerald-500/10"
			>
				<div
					class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm dark:bg-black"
				>
					<CircleCheckBig class="size-7" />
				</div>
				<h1 class="text-xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-400">
					Agendamento Confirmado
				</h1>
				<p
					class="mt-1 text-[10px] font-bold tracking-[0.2em] text-emerald-700/60 uppercase dark:text-emerald-400/60"
				>
					Recibo Digital
				</p>
			</div>

			<div class="space-y-8 p-8">
				<div class="flex items-center gap-4">
					<div
						class="flex size-10 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground shadow-sm"
					>
						<User2 class="size-5" />
					</div>
					<div class="flex flex-col">
						<span class="text-[10px] font-bold tracking-tight text-muted-foreground uppercase"
							>Profissional</span
						>
						<span class="font-semibold tracking-tight text-foreground"
							>{professional.full_name}</span
						>
					</div>
				</div>

				<div class="mt-2 flex items-center justify-between border-t border-dashed pt-6">
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2">
							<Calendar class="size-3.5 text-muted-foreground" />
							<span class="text-sm font-bold">{formattedDate}</span>
						</div>
						<span class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
							{dayName}
						</span>
					</div>

					<div class="h-8 w-px bg-border/50"></div>

					<div class="flex flex-col items-end gap-1">
						<div class="flex items-center gap-2">
							<Clock class="size-3.5 text-muted-foreground" />
							<span class="text-sm font-bold">{formattedTime}</span>
						</div>
						<span class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
							Horário Local
						</span>
					</div>
				</div>

				<!-- Bloco do Endereço (renderiza apenas se o campo address estiver preenchido) -->
				{#if professional.address}
					<div class="mt-2 border-t border-dashed pt-6">
						<div class="flex items-start gap-2.5">
							<MapPin class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
							<div class="flex flex-col">
								<span class="text-[10px] font-bold tracking-tight text-muted-foreground uppercase"
									>Local de Atendimento</span
								>
								<span class="mt-0.5 text-sm font-medium leading-relaxed text-foreground">
									{professional.address}
								</span>
							</div>
						</div>
					</div>
				{/if}

				<div class="rounded-2xl border border-border/50 bg-muted/40 p-4">
					<div class="flex flex-col">
						
						<span class="text-base font-bold text-primary">{appointment.service_name}</span>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-3 px-8 pb-8">
				<Button
					variant="default"
					class="h-12 w-full rounded-xl font-semibold transition-all active:scale-[0.98]"
					onclick={handleShare}
				>
					{#if copied}
						<span in:fade>Copiado!</span>
					{:else}
						<Share class="mr-2 size-4" />
						Compartilhar
					{/if}
				</Button>

				<Button
					variant="ghost"
					class="h-12 w-full rounded-xl font-medium text-muted-foreground transition-all hover:text-foreground"
					onclick={() => window.print()}
				>
					<Download class="mr-2 size-4" />
					Salvar Recibo
				</Button>
			</div>
		</Card.Root>

		<footer class="mt-8 text-center">
			<p class="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/40 uppercase">
				Coelo • 2026
			</p>
		</footer>
	</main>
</div>

<style>
	@media print {
		:global(body) {
			background: white !important;
		}
		.min-h-screen {
			min-height: auto !important;
			padding: 0 !important;
		}
		button,
		a,
		footer {
			display: none !important;
		}
		main {
			max-width: 100% !important;
		}
		:global(.border-none) {
			border: 1px solid #eee !important;
			box-shadow: none !important;
		}
	}
</style>