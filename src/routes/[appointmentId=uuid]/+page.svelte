<script lang="ts">
	import { page } from '$app/state';
	import { Share, ChevronLeft, Download } from '@lucide/svelte';
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
	const monthName = $derived(
		new Intl.DateTimeFormat('pt-BR', { timeZone: clientTz, month: 'long' })
			.format(appointment.startMs)
			.replace(/^\w/, (c) => c.toUpperCase())
	);
	const dayNumber = $derived(
		new Intl.DateTimeFormat('pt-BR', { timeZone: clientTz, day: 'numeric' }).format(
			appointment.startMs
		)
	);

	async function handleShare() {
		const addressInfo = professional.address ? ` em ${professional.address}` : '';
		const message = `${appointment.service_name} com ${professional.full_name} no dia ${formattedDate} (${dayName}) às ${formattedTime}${addressInfo}`;
		const shareData = { title: 'Meu Agendamento', text: message, url: window.location.href };
		if (navigator.share) {
			try {
				await navigator.share(shareData);
			} catch (err) {}
		} else {
			await navigator.clipboard.writeText(
				`${shareData.title}: ${message}\n\nLink: ${window.location.href}`
			);
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
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="shell">
	<nav class="nav">
		<a href="/{professional.username}" class="back-link">
			<ChevronLeft size={16} strokeWidth={2} />
			Nova reserva
		</a>
	</nav>

	<main in:fly={{ y: 20, duration: 600, delay: 60 }} class="main">
		<!-- Greeting -->
		<header class="greeting" in:fade={{ duration: 400, delay: 180 }}>
			<div class="check-icon" aria-hidden="true">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<circle cx="10" cy="10" r="10" fill="#18181B" />
					<polyline
						points="5.5,10.5 8.5,13.5 14.5,7.5"
						stroke="white"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						fill="none"
					/>
				</svg>
			</div>
			<p class="greeting-sub capitalize">Tudo pronto, {firstName}!</p>
			<h1 class="greeting-title">Seu horário<br /><em>está confirmado.</em></h1>
		</header>

		<!-- Card -->
		<article class="card">
			<!-- Date hero -->
			<div class="date-hero">
				<div class="date-main">
					<span class="date-day">{dayNumber}</span>
					<div class="date-text">
						<span class="date-month">{monthName}</span>
						<span class="date-weekday">{dayName}</span>
					</div>
				</div>
				<div class="time-main">
					<span class="time-value">{formattedTime}</span>
					<span class="time-label">horário local</span>
				</div>
			</div>

			<div class="card-divider" aria-hidden="true"></div>

			<!-- Details -->
			<div class="details">
				<div class="detail-row">
					<span class="detail-label">Serviço</span>
					<span class="detail-value">{appointment.service_name}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Profissional</span>
					<span class="detail-value">{professional.full_name}</span>
				</div>
				{#if professional.address}
					<div class="detail-row">
						<span class="detail-label">Local</span>
						<span class="detail-value">{professional.address}</span>
					</div>
				{/if}
			</div>
		</article>

		<!-- Actions -->
		<div class="actions" in:fade={{ duration: 400, delay: 500 }}>
			<button class="btn-share" onclick={handleShare}>
				{#if copied}
					<span in:fade>Copiado!</span>
				{:else}
					<Share size={15} strokeWidth={2} />
					<span>Compartilhar</span>
				{/if}
			</button>
			<button class="btn-save" onclick={() => window.print()} aria-label="Salvar recibo">
				<Download size={15} strokeWidth={2} />
				<span>Salvar recibo</span>
			</button>
		</div>

		<footer class="footer" in:fade={{ duration: 300, delay: 700 }}>
			Coelo · {new Date(appointment.startMs).getFullYear()}
		</footer>
	</main>
</div>

<style>
	*,
	*::before,
	*::after {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:root {
		--bg: #f2f2f2;
		--surface: #ffffff;
		--border: #e4e4e7;
		--ink: #18181b;
		--ink-2: #52525b;
		--ink-3: #a1a1aa;
		--f-serif: 'Instrument Serif', Georgia, serif;
		--f-sans: 'Inter', system-ui, sans-serif;
		--r: 20px;
	}

	.shell {
		min-height: 100svh;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.25rem 1.25rem 3rem;
		font-family: var(--f-sans);
		-webkit-font-smoothing: antialiased;
	}

	/* Nav */
	.nav {
		width: 100%;
		max-width: 420px;
		margin-bottom: 1.5rem;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-2);
		text-decoration: none;
		transition: color 0.15s;
	}
	.back-link:hover {
		color: var(--ink);
	}

	/* Main */
	.main {
		width: 100%;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* Greeting */
	.greeting {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 0 4px;
		margin-bottom: 1.5rem;
	}
	.check-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 4px;
	}
	.greeting-sub {
		font-size: 14px;
		font-weight: 500;
		color: var(--ink-2);
		letter-spacing: 0.01em;
	}
	.greeting-title {
		font-family: var(--f-serif);
		font-size: clamp(30px, 9vw, 38px);
		font-weight: 400;
		line-height: 1.15;
		color: var(--ink);
		letter-spacing: -0.02em;
	}
	.greeting-title em {
		font-style: italic;
		color: var(--ink-2);
	}

	/* Card */
	.card {
		background: var(--surface);
		border-radius: var(--r);
		border: 1px solid var(--border);
		overflow: hidden;
		width: 100%;
	}

	/* Date hero */
	.date-hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		padding: 1.5rem 1.5rem 1.25rem;
		gap: 12px;
	}
	.date-main {
		display: flex;
		align-items: flex-end;
		gap: 10px;
		min-width: 0;
		flex: 1;
	}
	.date-day {
		font-family: var(--f-serif);
		font-size: clamp(52px, 15vw, 68px);
		font-weight: 400;
		line-height: 1;
		color: var(--ink);
		letter-spacing: -0.03em;
		flex-shrink: 0;
	}
	.date-text {
		display: flex;
		flex-direction: column;
		padding-bottom: 8px;
		min-width: 0;
		overflow: hidden;
	}
	.date-month {
		font-size: 15px;
		font-weight: 600;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.date-weekday {
		font-size: 12px;
		color: var(--ink-3);
		font-weight: 400;
		text-transform: capitalize;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.time-main {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex-shrink: 0;
		padding-bottom: 8px;
	}
	.time-value {
		font-family: var(--f-serif);
		font-size: clamp(28px, 8vw, 36px);
		font-weight: 400;
		line-height: 1;
		color: var(--ink);
		letter-spacing: -0.02em;
	}
	.time-label {
		font-size: 10px;
		letter-spacing: 0.06em;
		color: var(--ink-3);
		text-transform: uppercase;
		margin-top: 5px;
		font-weight: 500;
	}

	/* Divider */
	.card-divider {
		height: 1px;
		background: var(--border);
		margin: 0 1.5rem;
	}

	/* Details */
	.details {
		padding: 1.25rem 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.detail-label {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.detail-value {
		font-size: 14px;
		font-weight: 500;
		color: var(--ink);
		line-height: 1.45;
	}

	/* Actions */
	.actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 1rem;
	}
	.btn-share {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		background: var(--ink);
		color: #fff;
		border: none;
		border-radius: 14px;
		padding: 15px 20px;
		font-family: var(--f-sans);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.01em;
		cursor: pointer;
		transition:
			opacity 0.15s,
			transform 0.12s;
	}
	.btn-share:hover {
		opacity: 0.88;
	}
	.btn-share:active {
		transform: scale(0.98);
	}

	.btn-save {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		background: transparent;
		color: var(--ink-2);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 14px 20px;
		font-family: var(--f-sans);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			transform 0.12s;
	}
	.btn-save:hover {
		background: var(--surface);
		color: var(--ink);
	}
	.btn-save:active {
		transform: scale(0.98);
	}

	/* Footer */
	.footer {
		margin-top: 2rem;
		text-align: center;
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	/* Print */
	@media print {
		.shell {
			background: white !important;
			padding: 0;
		}
		.nav,
		.actions,
		.footer {
			display: none !important;
		}
		.card {
			border: 1px solid #e4e4e7;
			box-shadow: none;
		}
		.main {
			max-width: 100%;
		}
	}
</style>
