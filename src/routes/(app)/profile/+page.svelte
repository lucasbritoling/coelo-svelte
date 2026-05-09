<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Camera, ArrowLeft, Loader2, Check, User, AtSign } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let fullName = $state(data.user?.full_name ?? '');
	let username = $state(data.user?.username ?? '');
	let avatarUrl = $state(data.user?.avatar_url ?? '');
	let isSaving = $state(false);
	let saved = $state(false);
	let nameFocused = $state(false);
	let usernameFocused = $state(false);

	const initials = $derived(
		fullName
			.split(' ')
			.map((n: string) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || '?'
	);

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
</script>

<div class="edit-profile-root" in:fly={{ y: 32, duration: 380, easing: cubicOut }}>
	<!-- Top bar -->
	<nav class="topbar">
		<button class="back-btn" onclick={() => history.back()} aria-label="Voltar">
			<ArrowLeft size={20} />
		</button>
		<span class="topbar-title">Editar Perfil</span>
		<div class="topbar-spacer"></div>
	</nav>

	<!-- Avatar + identity block -->
	<header class="identity-block">
		<div class="avatar-ring-wrapper">
			<div class="avatar-ring">
				<div class="avatar-inner">
					{#if avatarUrl}
						<img src={avatarUrl} alt={fullName} class="avatar-img" />
					{:else}
						<span class="avatar-initials">{initials}</span>
					{/if}
				</div>
			</div>

			<button class="camera-btn" onclick={handleAvatarUpload} aria-label="Alterar foto">
				<Camera size={14} strokeWidth={2.5} />
			</button>
		</div>

		<div class="identity-text">
			{#if fullName}
				<h1 class="identity-name" in:fade={{ duration: 180 }}>{fullName}</h1>
			{:else}
				<h1 class="identity-name placeholder-name">Seu nome</h1>
			{/if}
			<p class="identity-handle">
				coelo.dev/<span class="handle-accent">{username || 'username'}</span>
			</p>
		</div>

		<div class="identity-divider"></div>
	</header>

	<!-- Form -->
	<section class="form-section">
		<!-- Field: Full Name -->
		<div class="field-group" class:focused={nameFocused}>
			<label for="name" class="field-label">
				<User size={11} strokeWidth={3} />
				Nome Completo
			</label>
			<div class="input-wrap">
				<Input
					id="name"
					bind:value={fullName}
					onfocus={() => (nameFocused = true)}
					onblur={() => (nameFocused = false)}
					placeholder="Como você se chama?"
					class="styled-input"
					autocomplete="name"
				/>
				<div class="field-line"></div>
			</div>
		</div>

		<!-- Field: Username / Link -->
		<div class="field-group" class:focused={usernameFocused}>
			<label for="username" class="field-label">
				<AtSign size={11} strokeWidth={3} />
				Link da sua agenda
			</label>
			<div class="input-wrap username-wrap">
				<span class="url-prefix">coelo.dev/</span>
				<Input
					id="username"
					bind:value={username}
					onfocus={() => (usernameFocused = true)}
					onblur={() => (usernameFocused = false)}
					placeholder="seu-link"
					class="styled-input username-input"
					autocomplete="username"
				/>
				<div class="field-line"></div>
			</div>
		</div>

		<!-- Save Button -->
		<button
			class="save-btn"
			class:saving={isSaving}
			class:done={saved}
			onclick={handleSave}
			disabled={isSaving || saved}
		>
			{#if isSaving}
				<span class="btn-content" in:fade={{ duration: 120 }}>
					<Loader2 size={16} class="spin-icon" />
					Salvando...
				</span>
			{:else if saved}
				<span class="btn-content done-content" in:fade={{ duration: 120 }}>
					<Check size={16} strokeWidth={3} />
					Salvo!
				</span>
			{:else}
				<span class="btn-content" in:fade={{ duration: 120 }}> Salvar Alterações </span>
			{/if}
		</button>
	</section>

	<!-- Decorative bottom grain -->
	<div class="bottom-fade"></div>
</div>

<style>
	/* ── Root ─────────────────────────────────────────────── */
	.edit-profile-root {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		background-color: hsl(var(--background));
		overflow-x: hidden;
		font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
	}

	/* Subtle grain overlay */
	.edit-profile-root::before {
		content: '';
		position: fixed;
		inset: 0;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
		opacity: 0.025;
		pointer-events: none;
		z-index: 0;
	}

	/* ── Topbar ───────────────────────────────────────────── */
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1rem 0.75rem;
		position: relative;
		z-index: 1;
	}

	.topbar-title {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.topbar-spacer {
		width: 2.5rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 1px solid hsl(var(--border) / 0.5);
		background: hsl(var(--card));
		color: hsl(var(--foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.12s;
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.06);
	}

	.back-btn:active {
		transform: scale(0.92);
		background: hsl(var(--muted));
	}

	/* ── Identity Block ───────────────────────────────────── */
	.identity-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1.5rem 0;
		position: relative;
		z-index: 1;
	}

	.avatar-ring-wrapper {
		position: relative;
		margin-bottom: 1.25rem;
	}

	.avatar-ring {
		width: 7rem;
		height: 7rem;
		border-radius: 50%;
		padding: 3px;
		background: linear-gradient(
			135deg,
			hsl(var(--foreground) / 0.15) 0%,
			hsl(var(--foreground) / 0.05) 50%,
			hsl(var(--foreground) / 0.2) 100%
		);
		box-shadow:
			0 0 0 1px hsl(var(--border) / 0.4),
			0 8px 32px hsl(0 0% 0% / 0.12);
	}

	.avatar-inner {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		overflow: hidden;
		background: hsl(var(--muted));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initials {
		font-size: 1.875rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: hsl(var(--muted-foreground));
		line-height: 1;
	}

	.camera-btn {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: hsl(var(--background));
		border: 1.5px solid hsl(var(--border) / 0.6);
		color: hsl(var(--foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 8px hsl(0 0% 0% / 0.1);
		transition:
			transform 0.12s,
			background 0.15s;
	}

	.camera-btn:active {
		transform: scale(0.88);
		background: hsl(var(--muted));
	}

	.identity-text {
		text-align: center;
		margin-bottom: 2rem;
	}

	.identity-name {
		font-size: 1.625rem;
		font-weight: 800;
		letter-spacing: -0.035em;
		color: hsl(var(--foreground));
		line-height: 1.15;
		margin: 0 0 0.3rem;
	}

	.placeholder-name {
		color: hsl(var(--muted-foreground) / 0.4);
	}

	.identity-handle {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		font-weight: 400;
		letter-spacing: 0.01em;
		margin: 0;
	}

	.handle-accent {
		color: hsl(var(--foreground));
		font-weight: 600;
	}

	.identity-divider {
		width: 100%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			hsl(var(--border) / 0.6) 20%,
			hsl(var(--border) / 0.6) 80%,
			transparent
		);
	}

	/* ── Form Section ─────────────────────────────────────── */
	.form-section {
		padding: 2rem 1.5rem 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		flex: 1;
		position: relative;
		z-index: 1;
	}

	/* ── Field Group ──────────────────────────────────────── */
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground) / 0.7);
		transition: color 0.15s;
	}

	.field-group.focused .field-label {
		color: hsl(var(--foreground));
	}

	.input-wrap {
		position: relative;
	}

	/* Override shadcn Input */
	.input-wrap :global(.styled-input) {
		height: 3rem;
		border: none;
		border-radius: 0;
		background: transparent;
		padding-left: 0;
		padding-right: 0;
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: hsl(var(--foreground));
		box-shadow: none !important;
		outline: none !important;
	}

	.input-wrap :global(.styled-input::placeholder) {
		color: hsl(var(--muted-foreground) / 0.35);
		font-weight: 400;
	}

	.input-wrap :global(.styled-input:focus) {
		ring: none;
	}

	.field-line {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: hsl(var(--border) / 0.5);
		transition: background 0.2s;
	}

	.field-line::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		right: 50%;
		height: 1.5px;
		background: hsl(var(--foreground));
		transition:
			left 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			right 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.field-group.focused .field-line::after {
		left: 0;
		right: 0;
	}

	/* Username prefix */
	.username-wrap :global(.username-input) {
		padding-left: 4.75rem;
	}

	.url-prefix {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground) / 0.45);
		pointer-events: none;
		letter-spacing: -0.01em;
		line-height: 1;
		z-index: 2;
	}

	/* ── Save Button ──────────────────────────────────────── */
	.save-btn {
		margin-top: 0.5rem;
		height: 3.25rem;
		width: 100%;
		border-radius: 0.875rem;
		background: hsl(var(--foreground));
		color: hsl(var(--background));
		font-size: 0.9375rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		border: none;
		cursor: pointer;
		transition:
			transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.15s,
			background 0.2s;
		box-shadow:
			0 4px 20px hsl(0 0% 0% / 0.18),
			inset 0 1px 0 hsl(0 0% 100% / 0.08);
		position: relative;
		overflow: hidden;
	}

	.save-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, hsl(0 0% 100% / 0.06) 0%, transparent 60%);
		pointer-events: none;
	}

	.save-btn:not(:disabled):active {
		transform: scale(0.97);
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.save-btn.done {
		background: hsl(142 71% 34%);
		opacity: 1;
	}

	.btn-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.done-content {
		animation: pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	:global(.spin-icon) {
		animation: spin 0.8s linear infinite;
	}

	/* ── Decorative fade ──────────────────────────────────── */
	.bottom-fade {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 5rem;
		background: linear-gradient(to top, hsl(var(--background)), transparent);
		pointer-events: none;
		z-index: 0;
	}

	/* ── Keyframes ────────────────────────────────────────── */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pop {
		0% {
			transform: scale(0.85);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
