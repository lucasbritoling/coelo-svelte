<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import { Camera, ArrowLeft, Loader2, Check } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	// Estados reativos mapeados com Runes do Svelte 5
	let fullName = $state(data.user?.full_name ?? '');
	let username = $state(data.user?.username ?? '');
	let address = $state(data.user?.address ?? '');
	let phone = $state(data.user?.phone ?? '');
	let email = $state(data.user?.email ?? '');
	let password = $state('');

	const avatarUrl = $derived(data.user?.avatar_url ?? '');
	let uploading = $state(false);
	let isSaving = $state(false);
	let saved = $state(false);

	// Estados de foco dos inputs para efeito visual da barra animada
	let activeField = $state('');

	$effect(() => {
		if (form?.success) {
			saved = true;
			toast.success('Perfil updated com sucesso!');
			password = '';
			setTimeout(() => (saved = false), 2500);
		} else if (form?.message) {
			toast.error(form.message);
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

	function triggerFileInput() {
		document.getElementById('avatar-input')?.click();
	}
</script>

<div class="page max-w-3xl" in:fly={{ y: 20, duration: 260, easing: cubicOut }}>
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
				return async ({ result, update }) => {
					if (result.type === 'error') toast.error('Erro crítico no servidor');
					if (result.type === 'failure')
						toast.error(`Erro: ${result.data?.message || 'Verifique o arquivo'}`);
					if (result.type === 'success') {
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

				<input
					id="avatar-input"
					type="file"
					name="avatar"
					accept="image/*"
					style="display: none"
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				/>

				<button
					type="button"
					class="camera-trigger"
					onclick={triggerFileInput}
					disabled={uploading}
					aria-label="Alterar foto"
				>
					<Camera
						size={16}
						strokeWidth={2.5}
						style="filter: drop-shadow(0 0 2px white) drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))"
					/>
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

	<!-- FORMULÁRIO PRINCIPAL -->
	<form
		method="POST"
		action="?/updateProfile"
		use:enhance={() => {
			isSaving = true;
			return async ({ update }) => {
				await invalidateAll();
				await update();
				isSaving = false;
			};
		}}
		class="form-body mx-auto max-w-sm"
	>
		<div class="form-card">
			<!-- Campo Nome -->
			<div class="field" class:is-focused={activeField === 'fullName'}>
				<label for="fullName" class="field-label">Nome</label>
				<input
					id="fullName"
					name="fullName"
					type="text"
					bind:value={fullName}
					onfocus={() => (activeField = 'fullName')}
					onblur={() => (activeField = '')}
					placeholder="Como você se chama?"
					class="native-input"
					required
				/>
				<div class="field-bar" class:active={activeField === 'fullName'}></div>
			</div>

			<div class="field-divider"></div>

			<!-- Campo Link -->
			<div class="field" class:is-focused={activeField === 'username'}>
				<label for="username" class="field-label">Link da agenda</label>
				<div class="field-prefix-wrap">
					<span class="field-prefix">coelo.dev/</span>
					<input
						id="username"
						name="username"
						type="text"
						bind:value={username}
						onfocus={() => (activeField = 'username')}
						onblur={() => (activeField = '')}
						placeholder="seu-link"
						class="native-input"
						style="flex:1;min-width:0"
						required
					/>
				</div>
				<div class="field-bar" class:active={activeField === 'username'}></div>
			</div>

			<div class="field-divider"></div>

			<!-- Campo Endereço -->
			<div class="field" class:is-focused={activeField === 'address'}>
				<label for="address" class="field-label">Endereço de Atendimento</label>
				<input
					id="address"
					name="address"
					type="text"
					bind:value={address}
					onfocus={() => (activeField = 'address')}
					onblur={() => (activeField = '')}
					placeholder="Rua, Número, Sala ou 'Atendimento Online'"
					class="native-input"
				/>
				<div class="field-bar" class:active={activeField === 'address'}></div>
			</div>

			<div class="field-divider"></div>

			<!-- Campo Telefone -->
			<div class="field" class:is-focused={activeField === 'phone'}>
				<label for="phone" class="field-label">Telefone / WhatsApp</label>
				<input
					id="phone"
					name="phone"
					type="tel"
					bind:value={phone}
					onfocus={() => (activeField = 'phone')}
					onblur={() => (activeField = '')}
					placeholder="(11) 99999-9999"
					class="native-input"
				/>
				<div class="field-bar" class:active={activeField === 'phone'}></div>
			</div>

			<div class="field-divider"></div>

			<!-- Campo Email -->
			<div class="field" class:is-focused={activeField === 'email'}>
				<label for="email" class="field-label">E-mail de Login</label>
				<input
					id="email"
					name="email"
					type="email"
					bind:value={email}
					onfocus={() => (activeField = 'email')}
					onblur={() => (activeField = '')}
					placeholder="seu@email.com"
					class="native-input"
					required
				/>
				<div class="field-bar" class:active={activeField === 'email'}></div>
			</div>

			<div class="field-divider"></div>

			<!-- Campo Senha -->
			<div class="field" class:is-focused={activeField === 'password'}>
				<label for="password" class="field-label">Nova Senha</label>
				<input
					id="password"
					name="password"
					type="password"
					bind:value={password}
					onfocus={() => (activeField = 'password')}
					onblur={() => (activeField = '')}
					placeholder="Preencha apenas para alterar"
					class="native-input"
				/>
				<div class="field-bar" class:active={activeField === 'password'}></div>
			</div>
		</div>

		<!-- Botão Salvar -->
		<button
			type="submit"
			disabled={isSaving || saved}
			class="save-btn mx-auto max-w-xs"
			class:is-done={saved}
		>
			{#if isSaving}
				<Loader2 size={18} strokeWidth={2.5} class="spin-icon" />
				<span>Salvando</span>
			{:else if saved}
				<Check size={18} strokeWidth={2.5} />
				<span>Salvo!</span>
			{:else}
				<span>Salvar alterações</span>
			{/if}
		</button>
	</form>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		background: hsl(var(--background));
		width: 100%;
		max-width: 48rem;
		margin: 0 auto;
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
		width: 1.375rem;
		height: 1.375rem;
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
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground) / 0.4);
		margin-bottom: 0.2rem;
		transition: color 0.2s ease;
	}

	.field.is-focused .field-label {
		color: hsl(var(--foreground) / 0.85);
	}

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
