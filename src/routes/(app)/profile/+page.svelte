<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Camera, ArrowLeft, Loader2, Check } from '@lucide/svelte';
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
			.slice(0, 1)
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

<div
	class="flex min-h-full flex-col bg-background"
	in:fly={{ y: 20, duration: 260, easing: cubicOut }}
>
	<!-- TOPBAR -->
	<div class="flex items-center justify-between px-4 pt-5 pb-2">
		<button onclick={() => history.back()} class="back-btn" aria-label="Voltar">
			<ArrowLeft class="size-[18px]" strokeWidth={2} />
		</button>
		<span class="topbar-title">Editar Perfil</span>
		<div class="size-9"></div>
	</div>

	<!-- AVATAR HERO -->
	<div class="avatar-hero">
		<div class="avatar-wrapper">
			<div class="avatar-shell">
				{#if avatarUrl}
					<img src={avatarUrl} alt={fullName} class="h-full w-full object-cover" />
				{:else}
					<span class="avatar-initials">{initials}</span>
				{/if}
			</div>
			<button class="camera-trigger" onclick={handleAvatarUpload} aria-label="Alterar foto">
				<Camera class="size-4" strokeWidth={2} />
			</button>
		</div>

		<div class="avatar-identity">
			<h1 class="identity-name">{fullName || 'Seu nome'}</h1>
			<p class="identity-handle">
				<span class="handle-domain">coelo.dev/</span><span class="handle-slug">{username || 'username'}</span>
			</p>
		</div>
	</div>

	<!-- FORM -->
	<div class="form-body">

		<div class="form-card">

			<!-- Campo: Nome -->
			<div class="field" class:is-focused={nameFocused}>
				<label for="name" class="field-label">Nome completo</label>
				<Input
					id="name"
					bind:value={fullName}
					onfocus={() => (nameFocused = true)}
					onblur={() => (nameFocused = false)}
					placeholder="Como você se chama?"
					class="field-input"
					autocomplete="name"
				/>
				<div class="field-bar" class:active={nameFocused}></div>
			</div>

			<div class="field-divider"></div>

			<!-- Campo: Link -->
			<div class="field" class:is-focused={usernameFocused}>
				<label for="username" class="field-label">Link da agenda</label>
				<div class="field-prefix-wrap">
					<span class="field-prefix">coelo.dev/</span>
					<Input
						id="username"
						bind:value={username}
						onfocus={() => (usernameFocused = true)}
						onblur={() => (usernameFocused = false)}
						placeholder="seu-link"
						class="field-input field-input-prefixed"
						autocomplete="username"
					/>
				</div>
				<div class="field-bar" class:active={usernameFocused}></div>
			</div>

		</div>

		<!-- Botão Salvar -->
		<button
			onclick={handleSave}
			disabled={isSaving || saved}
			class="save-btn"
			class:is-done={saved}
		>
			{#if isSaving}
				<Loader2 class="size-[18px] shrink-0 spin-icon" />
				<span>Salvando...</span>
			{:else if saved}
				<Check class="size-[18px] shrink-0" strokeWidth={2.5} />
				<span>Salvo!</span>
			{:else}
				<span>Salvar alterações</span>
			{/if}
		</button>

	</div>
</div>

<style>
	/* ── Topbar ─────────────────────────────────── */
	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--border) / 0.6);
		background: transparent;
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: background 0.12s, transform 0.1s;
		-webkit-tap-highlight-color: transparent;
	}
	.back-btn:active {
		transform: scale(0.9);
		background: hsl(var(--muted));
	}

	.topbar-title {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	/* ── Avatar hero ─────────────────────────────── */
	.avatar-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1.25rem 2rem;
		gap: 1rem;
	}

	.avatar-wrapper {
		position: relative;
	}

	.avatar-shell {
		width: 6rem;
		height: 6rem;
		border-radius: 9999px;
		overflow: hidden;
		background: hsl(var(--muted));
		border: 1.5px solid hsl(var(--border) / 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-initials {
		font-size: 2rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.camera-trigger {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 1.875rem;
		height: 1.875rem;
		border-radius: 9999px;
		background: hsl(var(--background));
		border: 1.5px solid hsl(var(--border));
		color: hsl(var(--foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 1px 4px hsl(0 0% 0% / 0.1);
		transition: transform 0.1s, background 0.12s;
		-webkit-tap-highlight-color: transparent;
	}
	.camera-trigger:active {
		transform: scale(0.88);
		background: hsl(var(--muted));
	}

	.avatar-identity {
		text-align: center;
	}

	.identity-name {
		font-size: 1.375rem;
		font-weight: 700;
		letter-spacing: -0.025em;
		line-height: 1.2;
		color: hsl(var(--foreground));
		margin: 0 0 0.35rem;
	}

	.identity-handle {
		font-size: 13px;
		line-height: 1;
		margin: 0;
	}

	.handle-domain {
		color: hsl(var(--muted-foreground));
		font-weight: 400;
	}

	.handle-slug {
		color: hsl(var(--foreground));
		font-weight: 600;
	}

	/* ── Form ────────────────────────────────────── */
	.form-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0 0.75rem 2.5rem;
	}

	.form-card {
		border-radius: 1.5rem;
		border: 1px solid hsl(var(--border) / 0.5);
		background: hsl(var(--card));
		overflow: hidden;
	}

	.field-divider {
		height: 1px;
		background: hsl(var(--border) / 0.4);
		margin: 0 1.25rem;
	}

	/* ── Campos ──────────────────────────────────── */
	.field {
		padding: 1rem 1.25rem 0;
		position: relative;
	}

	.field-label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground) / 0.55);
		margin-bottom: 0.1rem;
		transition: color 0.15s;
	}

	.field.is-focused .field-label {
		color: hsl(var(--foreground));
	}

	:global(.field-input) {
		height: 2.625rem !important;
		border: none !important;
		border-radius: 0 !important;
		background: transparent !important;
		padding-left: 0 !important;
		padding-right: 0 !important;
		font-size: 1rem !important;
		font-weight: 500 !important;
		letter-spacing: -0.01em !important;
		color: hsl(var(--foreground)) !important;
		box-shadow: none !important;
		outline: none !important;
	}
	:global(.field-input::placeholder) {
		color: hsl(var(--muted-foreground) / 0.28) !important;
		font-weight: 400 !important;
	}

	.field-prefix-wrap {
		display: flex;
		align-items: center;
	}

	.field-prefix {
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: hsl(var(--muted-foreground) / 0.45);
		white-space: nowrap;
		line-height: 2.625rem;
		flex-shrink: 0;
	}

	:global(.field-input-prefixed) {
		flex: 1 !important;
		min-width: 0 !important;
	}

	.field-bar {
		height: 1px;
		background: hsl(var(--border) / 0.35);
		position: relative;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.field-bar::after {
		content: '';
		position: absolute;
		inset: 0;
		height: 1.5px;
		background: hsl(var(--foreground));
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.field-bar.active::after {
		transform: scaleX(1);
	}

	/* ── Botão salvar ─────────────────────────────── */
	.save-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		height: 3.25rem;
		width: 100%;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--foreground));
		color: hsl(var(--background));
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.005em;
		cursor: pointer;
		transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, opacity 0.15s;
		-webkit-tap-highlight-color: transparent;
		margin-top: 0.25rem;
	}

	.save-btn:not(:disabled):active {
		transform: scale(0.97);
	}

	.save-btn:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.save-btn.is-done {
		background: #1f5c13;
		opacity: 1;
	}

	:global(.spin-icon) {
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>