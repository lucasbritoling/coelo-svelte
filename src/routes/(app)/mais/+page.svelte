<script lang="ts">
	import { fly } from 'svelte/transition';
	import { ChevronRight, LogOut, ChevronLeft, Clock, BriefcaseBusiness } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const avatarUrl = $derived(data.user?.avatar_url);

	const profile = {
		name: data.user?.full_name ?? 'Usuário',
		slug: data.user?.username ?? 'username'
	};

	const initials = $derived(profile.name[0]?.toUpperCase() ?? '?');
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
			href="/horarios"
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
		<form method="POST" action="/logout">
			<button
				type="submit"
				class="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/50"
			>
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
					<LogOut class="size-4 text-muted-foreground" />
				</div>
				<p class="text-[14px] font-medium text-destructive">Sair</p>
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
