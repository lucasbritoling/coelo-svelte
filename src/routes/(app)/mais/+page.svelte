<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Camera, ArrowLeft, Loader2, Check, Copy } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let fullName = $state(data.user?.full_name ?? '');
	let username = $state(data.user?.username ?? '');
	let avatarUrl = $state(data.user?.avatar_url ?? '');
	let isSaving = $state(false);
	let saved = $state(false);
	let copied = $state(false);
	let nameFocused = $state(false);
	let usernameFocused = $state(false);

	const initials = $derived(
		fullName
			.split(' ')
			.map((n: string) => n[0])
			.slice(0, 1)
			.join('')
			.toUpperCase() || '?'
	);

	const schedulingLink = $derived(`coelo.dev/${username || data.username}`);

	async function handleSave() {
		isSaving = true;
		await new Promise((r) => setTimeout(r, 1200));
		isSaving = false;
		saved = true;
		toast.success('Perfil atualizado!');
		setTimeout(() => (saved = false), 2500);
	}

	function handleAvatarUpload() {
		toast.info('Upload de imagem em breve');
	}

	function copyLink() {
		navigator.clipboard
			.writeText(schedulingLink)
			.then(() => {
				copied = true;
				setTimeout(() => (copied = false), 2000);
			})
			.catch(() => toast.error('Erro ao copiar o link.'));
	}
</script>

<div
	class="flex min-h-full flex-col bg-background"
	in:fly={{ y: 24, duration: 280, easing: cubicOut }}
>
	<!-- HEADER — mesmo padrão sticky do dashboard -->
	<div class="top-0! z-20 bg-background/80 backdrop-blur-xl">
		<div class="flex items-center justify-between px-5 pt-6 pb-4">
			<button onclick={() => history.back()} class="back-btn" aria-label="Voltar">
				<ArrowLeft class="size-5" strokeWidth={2} />
			</button>

			<span class="section-label" style="padding:0; opacity:1">Editar Perfil</span>

			<!-- Spacer para centralizar -->
			<div class="size-10"></div>
		</div>
	</div>

	<!-- AVATAR -->
	<div class="flex flex-col items-center px-5 pt-2 pb-6">
		<div class="avatar-wrapper">
			<div class="avatar-shell">
				{#if avatarUrl}
					<img src={avatarUrl} alt={fullName} class="h-full w-full object-cover" />
				{:else}
					<span class="avatar-initials">{initials}</span>
				{/if}
			</div>
			<button class="camera-trigger" onclick={handleAvatarUpload} aria-label="Alterar foto">
				<Camera class="size-3.5" strokeWidth={2.5} />
			</button>
		</div>

		<h1
			class="mt-4 text-[1.5rem] leading-none font-semibold tracking-tight"
			class:opacity-40={!fullName}
		>
			{fullName || 'Seu nome'}
		</h1>
		<p class="text-[13px] text-muted-foreground">
			coelo.dev/<span class="font-medium text-foreground">{username || 'username'}</span>
		</p>
	</div>

	<!-- CARDS — mesma estrutura rounded-[30px] border bg-card do dashboard -->
	<div class="flex flex-col gap-3 px-3 pb-36">
		<!-- Card: dados pessoais -->
		<div class="rounded-[30px] border border-border/50 bg-card px-5 py-5">
			<p class="section-label mb-4">Informações</p>

			<!-- Nome Completo -->
			<div class="field-row" class:focused={nameFocused}>
				<label for="name" class="field-label">Nome Completo</label>
				<div class="relative">
					<Input
						id="name"
						bind:value={fullName}
						onfocus={() => (nameFocused = true)}
						onblur={() => (nameFocused = false)}
						placeholder="Como você se chama?"
						class="field-input"
						autocomplete="name"
					/>
				</div>
				<div class="field-line" class:active={nameFocused}></div>
			</div>

			<div class="my-4 h-px bg-border/40"></div>

			<!-- Link / Username -->
			<div class="field-row" class:focused={usernameFocused}>
				<label for="username" class="field-label">Link da agenda</label>
				<div class="relative">
					<span class="prefix-text">coelo.dev/</span>
					<Input
						id="username"
						bind:value={username}
						onfocus={() => (usernameFocused = true)}
						onblur={() => (usernameFocused = false)}
						placeholder="seu-link"
						class="field-input username-input"
						autocomplete="username"
					/>
				</div>
				<div class="field-line" class:active={usernameFocused}></div>
			</div>
		</div>
	</div>
</div>

<!-- FAB — idêntico ao do dashboard (mesmo size, posição, bg-black) -->
<button
	onclick={handleSave}
	disabled={isSaving || saved}
	class="fab"
	class:fab-done={saved}
	aria-label="Salvar alterações"
>
	{#if isSaving}
		<Loader2 class="size-7 animate-spin" strokeWidth={2.5} />
	{:else if saved}
		<Check class="size-7" strokeWidth={3} />
	{:else}
		<Check class="size-7" strokeWidth={2.5} />
	{/if}
</button>

<style>
	/* ── Back button ────────────────────────────── */
	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--border) / 0.5);
		background: hsl(var(--card));
		color: hsl(var(--foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.12s;
		-webkit-tap-highlight-color: transparent;
	}
	.back-btn:active {
		transform: scale(0.92);
		background: hsl(var(--muted));
	}

	/* ── Section label — cópia exata do dashboard ── */
	.section-label {
		display: block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		opacity: 0.7;
	}

	/* ── Avatar ─────────────────────────────────── */
	.avatar-wrapper {
		position: relative;
	}
	.avatar-shell {
		width: 5.5rem;
		height: 5.5rem;
		border-radius: 9999px;
		overflow: hidden;
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border) / 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px hsl(0 0% 0% / 0.07);
	}
	.avatar-initials {
		font-size: 1.625rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: hsl(var(--muted-foreground));
		line-height: 1;
	}
	.camera-trigger {
		position: absolute;
		bottom: 1px;
		right: 1px;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 9999px;
		background: hsl(var(--background));
		border: 1.5px solid hsl(var(--border) / 0.6);
		color: hsl(var(--foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 6px hsl(0 0% 0% / 0.08);
		transition:
			transform 0.12s,
			background 0.15s;
		-webkit-tap-highlight-color: transparent;
	}
	.camera-trigger:active {
		transform: scale(0.88);
		background: hsl(var(--muted));
	}

	/* ── Field rows ─────────────────────────────── */
	.field-row {
		position: relative;
		padding-bottom: 2px;
	}
	.field-label {
		display: block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground) / 0.55);
		margin-bottom: 0.3rem;
		transition: color 0.15s;
	}
	.field-row.focused .field-label {
		color: hsl(var(--foreground));
	}

	/* Override shadcn Input — borda e bg removidos, underline only */
	:global(.field-input) {
		height: 2.75rem !important;
		border: none !important;
		border-radius: 0 !important;
		background: transparent !important;
		padding-left: 0 !important;
		padding-right: 0 !important;
		font-size: 15px !important;
		font-weight: 500 !important;
		color: hsl(var(--foreground)) !important;
		box-shadow: none !important;
		outline: none !important;
	}
	:global(.field-input::placeholder) {
		color: hsl(var(--muted-foreground) / 0.3) !important;
		font-weight: 400 !important;
	}
	:global(.username-input) {
		padding-left: 5.3rem !important;
	}

	.prefix-text {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		font-size: 15px;
		font-weight: 500;
		color: hsl(var(--muted-foreground) / 0.4);
		pointer-events: none;
		z-index: 2;
		line-height: 1;
	}

	/* Underline animado */
	.field-line {
		height: 1px;
		background: hsl(var(--border) / 0.4);
		position: relative;
		overflow: hidden;
	}
	.field-line::after {
		content: '';
		position: absolute;
		inset: 0;
		height: 1.5px;
		background: hsl(var(--foreground));
		transform: scaleX(0);
		transform-origin: center;
		transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.field-line.active::after {
		transform: scaleX(1);
	}

	/* ── Copy button — igual ao dashboard ──────── */
	.copy-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		height: 3rem;
		width: 100%;
		border-radius: 1rem;
		border: 1px solid hsl(var(--border) / 0.5);
		background: hsl(var(--muted) / 0.4);
		font-size: 14px;
		font-weight: 500;
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: transform 0.12s;
		-webkit-tap-highlight-color: transparent;
	}
	.copy-btn:active {
		transform: scale(0.98);
	}

	/* ── FAB — cópia exata do dashboard ─────────── */
	.fab {
		position: fixed;
		right: 1.25rem;
		bottom: 6rem;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border-radius: 9999px;
		background: black;
		color: white;
		border: none;
		cursor: pointer;
		box-shadow: 0 8px 32px hsl(0 0% 0% / 0.22);
		transition:
			transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.2s,
			opacity 0.15s;
		-webkit-tap-highlight-color: transparent;
	}
	.fab:not(:disabled):active {
		transform: scale(0.94);
	}
	.fab:disabled {
		opacity: 0.65;
	}
	.fab.fab-done {
		background: #2c6b1e;
	}

	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
