<script lang="ts">
	import { fly } from 'svelte/transition';
	import { ChevronRight, LogOut } from '@lucide/svelte';

	let { data } = $props();

	const profile = {
		name: data.user?.full_name ?? 'Usuário',
		slug: data.username
	};
</script>

<div class="flex min-h-full flex-col pb-28" in:fly={{ x: -24, duration: 200 }}>
	<div class="px-5 pt-6 pb-2">
		<h1 class="text-[26px] leading-tight font-medium tracking-tight">Mais</h1>
	</div>

	<!-- ── CONTA ────────────────────────────────────────────────────── -->
	<p class="section-label">conta</p>
	<div class="mx-3 overflow-hidden rounded-2xl border border-border/40 bg-card">
		<button class="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/50">
			<div
				class="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-medium text-blue-600 uppercase"
			>
				{profile.name[0]}
			</div>
			<div class="min-w-0 flex-1">
				<!-- truncate garante que nomes longos não empurrem o ícone de Chevron -->
				<p class="truncate text-[14px] font-medium">{profile.name}</p>
				<p class="truncate text-[12px] text-muted-foreground">coelo.dev/{profile.slug}</p>
			</div>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground/40" />
		</button>
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
