<script lang="ts">
	import { fly } from 'svelte/transition';
	import {
		ChevronRight,
		LogOut,
		ChevronLeft,
		Clock,
		BriefcaseBusiness,
		LoaderCircle,
		CalendarCog
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const avatarUrl = $derived(data.user?.avatar_url);

	const profile = {
		name: data.user?.full_name ?? 'Usuário',
		slug: data.user?.username ?? 'username'
	};

	const initials = $derived(profile.name[0]?.toUpperCase() ?? '?');

	let confirmLogout = $state(false);
	let isLoggingOut = $state(false);

	$effect(() => {
		if (confirmLogout && !isLoggingOut) {
			const timer = setTimeout(() => {
				confirmLogout = false;
			}, 2000);
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="mx-auto flex min-h-full max-w-xl flex-col pb-28" in:fly={{ x: -24, duration: 200 }}>
	<div class="px-5 pt-8 pb-4">
		<div class="flex items-center gap-2">
			<button
				onclick={() => goto('/agenda')}
				class="-ml-2 flex items-center p-2 text-muted-foreground transition-transform active:scale-90"
			>
				<ChevronLeft size={24} strokeWidth={2.5} />
			</button>
			<h1 class="text-[26px] leading-tight font-medium tracking-tight">Mais</h1>
		</div>
	</div>

	<!-- ── CONTA ────────────────────────────────────────────────────── -->
	<p class="section-label">conta</p>
	<div class="mx-3 overflow-hidden rounded-2xl border border-border/40 bg-card">
		<a
			href="/profile"
			class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50"
		>
			<div
				class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/40 bg-muted"
			>
				{#if avatarUrl}
					<img src={avatarUrl} alt={profile.name} class="h-full w-full object-cover" />
				{:else}
					<span class="text-sm font-medium text-muted-foreground uppercase">
						{initials}
					</span>
				{/if}
			</div>

			<div class="min-w-0 flex-1">
				<p class="truncate text-[14px] font-medium">{profile.name}</p>
				<p class="truncate text-[12px] text-muted-foreground">coelo.dev/{profile.slug}</p>
			</div>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
		</a>
	</div>

	<!-- ── CONFIGURAÇÕES ────────────────────────────────────────────── -->
	<p class="section-label">configurações</p>
	<div class="mx-3 overflow-hidden rounded-2xl border border-border/40 bg-card">
		<a
			href="/configuracoes"
			class="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors active:bg-muted/50"
		>
			<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
				<CalendarCog class="size-4 text-muted-foreground" />
			</div>
			<p class="flex-1 text-[14px] font-medium">Ajustes da Agenda</p>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
		</a>
		<a
			href="/servicos"
			class="flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors active:bg-muted/50"
		>
			<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
				<BriefcaseBusiness class="size-4 text-muted-foreground" />
			</div>
			<p class="flex-1 text-[14px] font-medium">Serviços</p>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
		</a>

		<a
			href="/rotina"
			class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50"
		>
			<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
				<Clock class="size-4 text-muted-foreground" />
			</div>
			<p class="flex-1 text-[14px] font-medium">Rotina Semanal</p>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
		</a>
	</div>

	<!-- ── SESSÃO ───────────────────────────────────────────────────── -->
	<p class="section-label">sessão</p>
	<div class="mx-3 overflow-hidden rounded-2xl border border-border/40 bg-card">
		<form method="POST" action="/logout" onsubmit={() => (isLoggingOut = true)}>
			<button
				type={confirmLogout ? 'submit' : 'button'}
				onclick={(e) => {
					if (!confirmLogout) {
						e.preventDefault();
						confirmLogout = true;
					}
				}}
				/* No Svelte 5, usamos ternários ou funções auxiliares dentro de template strings */
				class={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 active:bg-muted/50 ${
					confirmLogout ? 'bg-destructive/5' : ''
				}`}
			>
				<div
					class={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors ${
						confirmLogout ? 'bg-destructive/10' : ''
					}`}
				>
					{#if isLoggingOut}
						<LoaderCircle class="size-4 animate-spin text-destructive" />
					{:else}
						<LogOut
							class={`size-4 ${confirmLogout ? 'text-destructive' : 'text-muted-foreground'}`}
						/>
					{/if}
				</div>

				<div class="flex flex-1 flex-col">
					<p
						class={`text-[14px] font-medium transition-colors ${confirmLogout ? 'text-destructive' : ''}`}
					>
						{#if isLoggingOut}
							Saindo...
						{:else if confirmLogout}
							Tem certeza?
						{:else}
							Sair
						{/if}
					</p>
				</div>
			</button>
		</form>
	</div>
</div>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
	.section-label {
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		padding: 10px 16px 6px;
		color: hsl(var(--muted-foreground));
	}
</style>
