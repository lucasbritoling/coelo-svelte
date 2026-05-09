<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import { Camera, ArrowLeft, Loader2, Check } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	// Estados reativos com Runes
	let fullName = $state(data.user?.full_name ?? '');
	let username = $state(data.user?.username ?? '');

	// Sincroniza o avatarUrl com o retorno da Action ou com o dado inicial
	const avatarUrl = $derived(data.user?.avatar_url ?? '');

	let uploading = $state(false);
	let isSaving = $state(false);
	let saved = $state(false);
	let nameFocused = $state(false);
	let usernameFocused = $state(false);

	// O $effect do avatarUrl não é mais necessário,
	// pois o invalidateAll + $derived cuidam disso.
	$effect(() => {
		if (form?.success) {
			toast.success('Foto atualizada!');
		}
	});

	const initials = $derived(
		fullName
			.split(' ')
			.map((n: string) => n[0])
			.slice(0, 1)
			.join('')
			.toUpperCase() || '?'
	);

	// Função para disparar o clique no input escondido
	function triggerFileInput() {
		document.getElementById('avatar-input')?.click();
	}

	async function handleSave() {
		isSaving = true;
		// Aqui você chamará sua outra Action de salvar dados do perfil futuramente
		await new Promise((r) => setTimeout(r, 1200));
		isSaving = false;
		saved = true;
		toast.success('Perfil atualizado!');
		setTimeout(() => (saved = false), 2500);
	}
</script>

<div class="page" in:fly={{ y: 20, duration: 260, easing: cubicOut }}>
	<!-- TOPBAR -->
	<div class="topbar">
		<button onclick={() => history.back()} class="back-btn" aria-label="Voltar">
			<ArrowLeft size={18} strokeWidth={2} />
		</button>
		<span class="topbar-title">Editar Perfil</span>
		<div style="width:2.25rem"></div>
	</div>

	<!-- AVATAR HERO -->
	<div class="avatar-hero">
		<form
			method="POST"
			action="?/updateAvatar"
			enctype="multipart/form-data"
			use:enhance={() => {
				uploading = true;
				console.log('Iniciando upload via enhance...');
				return async ({ result, update }) => {
					console.log('Resultado da Action recebido:', result);

					if (result.type === 'error') {
						console.error('Erro fatal (500) na Action');
						toast.error('Erro crítico no servidor');
					}

					if (result.type === 'failure') {
						console.warn('A Action retornou falha (400/4xx):', result.data);
						toast.error(`Erro: ${result.data?.message || 'Verifique o arquivo'}`);
					}

					if (result.type === 'success') {
						console.log('Upload confirmado pelo servidor:', result.data);
						// O update() aqui vai atualizar o objeto 'form'
						await invalidateAll();
						await update();
					}
					uploading = false;
				};
			}}
		>
			<div class="avatar-wrapper">
				<div class="avatar-shell">
					{#if uploading}
						<Loader2 size={24} class="spin-icon text-muted-foreground/50" />
					{:else if avatarUrl}
						<img src={avatarUrl} alt={fullName} style="width:100%;height:100%;object-fit:cover" />
					{:else}
						<span class="avatar-initials">{initials}</span>
					{/if}
				</div>

				<!-- Input real escondido -->
				<input
					id="avatar-input"
					type="file"
					name="avatar"
					accept="image/*"
					class="hidden"
					style="display: none"
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				/>

				<!-- Botão visual que dispara o input -->
				<button
					type="button"
					class="camera-trigger"
					onclick={triggerFileInput}
					disabled={uploading}
					aria-label="Alterar foto"
				>
					<Camera size={14} strokeWidth={2.5} />
				</button>
			</div>
		</form>

		<div class="avatar-identity">
			<h1 class="identity-name">{fullName || 'Seu nome'}</h1>
			<p class="identity-handle">
				<span class="handle-domain">coelo.dev/</span><span class="handle-slug"
					>{username || 'username'}</span
				>
			</p>
		</div>
	</div>

	<!-- FORM -->
	<div class="form-body">
		<!-- Card -->
		<div class="form-card">
			<!-- Campo Nome -->
			<div class="field" class:is-focused={nameFocused}>
				<label for="name" class="field-label">Nome completo</label>
				<input
					id="name"
					type="text"
					bind:value={fullName}
					onfocus={() => (nameFocused = true)}
					onblur={() => (nameFocused = false)}
					placeholder="Como você se chama?"
					autocomplete="name"
					class="native-input"
				/>
				<div class="field-bar" class:active={nameFocused}></div>
			</div>

			<div class="field-divider"></div>

			<!-- Campo Link -->
			<div class="field" class:is-focused={usernameFocused}>
				<label for="username" class="field-label">Link da agenda</label>
				<div class="field-prefix-wrap">
					<span class="field-prefix">coelo.dev/</span>
					<input
						id="username"
						type="text"
						bind:value={username}
						onfocus={() => (usernameFocused = true)}
						onblur={() => (usernameFocused = false)}
						placeholder="seu-link"
						autocomplete="username"
						class="native-input"
						style="flex:1;min-width:0"
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
				<Loader2 size={18} strokeWidth={2.5} class="spin-icon" />
				<span>Salvando...</span>
			{:else if saved}
				<Check size={18} strokeWidth={2.5} />
				<span>Salvo!</span>
			{:else}
				<span>Salvar alterações</span>
			{/if}
		</button>
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		background: hsl(var(--background));
	}

	/* ── Topbar ─────────────────────────────────── */
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1rem 0.5rem;
	}

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
		transition:
			background 0.12s,
			transform 0.1s;
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
		gap: 0.875rem;
	}

	.avatar-wrapper {
		position: relative;
	}

	.avatar-shell {
		width: 5.5rem;
		height: 5.5rem;
		border-radius: 9999px;
		overflow: hidden;
		background: hsl(var(--muted));
		border: 1.5px solid hsl(var(--border));
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 12px hsl(0 0% 0% / 0.08);
	}

	.avatar-initials {
		font-size: 1.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.camera-trigger {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 9999px;
		background: #ffffff;
		border: 1.5px solid hsl(var(--border));
		color: hsl(var(--foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 1px 4px hsl(0 0% 0% / 0.12);
		transition:
			transform 0.1s,
			background 0.12s;
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
		margin: 0 0 0.3rem;
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
		border: 1px solid hsl(var(--border));
		background: hsl(var(--card));
		overflow: hidden;
	}

	.field-divider {
		height: 1px;
		background: hsl(var(--border) / 0.5);
		margin: 0 1.25rem;
	}

	/* ── Campos ──────────────────────────────────── */
	.field {
		padding: 1rem 1.25rem 0;
	}

	.field-label {
		display: block;
		font-size: 11px;

		/* 1. Peso: 600 ainda é forte. 500 ou 600 com menos opacidade 
       ajuda a não "competir" com o texto principal */
		font-weight: 600;

		/* 2. Letter-spacing: 0.07em é bem aberto. 
       0.04em ou 0.05em costuma ser o "sweet spot" para uppercase no mobile */
		letter-spacing: 0.05em;

		text-transform: uppercase;

		/* 3. Saturação/Peso Visual: Reduzi de 0.55 para 0.4.
       Isso faz o label "recuar" no layout, dando destaque ao dado do usuário */
		color: hsl(var(--muted-foreground) / 0.4);

		margin-bottom: 0.2rem;
		transition: color 0.2s ease;
	}

	.field.is-focused .field-label {
		/* No foco, trazemos ele para perto do preto total para dar feedback de atividade */
		color: hsl(var(--foreground) / 0.85);
	}

	/* Input nativo — sem depender de shadcn */
	.native-input {
		display: block;
		width: 100%;
		height: 2.625rem;
		border: none;
		background: transparent;
		padding: 0;
		font-size: 1rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: hsl(var(--foreground));
		outline: none;
		box-shadow: none;
		font-family: inherit;
	}

	.native-input::placeholder {
		color: hsl(var(--muted-foreground) / 0.3);
		font-weight: 400;
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
		flex-shrink: 0;
		line-height: 2.625rem;
	}

	/* Barra animada */
	.field-bar {
		height: 1px;
		background: hsl(var(--border) / 0.4);
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

		/* Cores fixas: bg-black e text-white */
		background: #000000;
		color: #ffffff;

		font-size: 15px;
		font-weight: 600;
		font-family: inherit;
		letter-spacing: 0.005em;
		cursor: pointer;
		transition:
			transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.3s ease,
			opacity 0.15s;
		-webkit-tap-highlight-color: transparent;
		margin-top: 0.25rem;

		/* Sombra sutil para dar profundidade no fundo branco */
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
		to {
			transform: rotate(360deg);
		}
	}

	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
