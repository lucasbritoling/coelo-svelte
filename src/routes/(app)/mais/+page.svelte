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
			}, 2500); // 2.5s dá um tempo mais confortável de leitura para a confirmação
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="mx-auto flex min-h-full max-w-xl flex-col pb-28" in:fly={{ x: -16, duration: 250 }}>
	<div class="px-6 pt-8 pb-3">
		<div class="flex items-center gap-3">
			<button
				onclick={() => goto('/agenda')}
				class="-ml-2.5 flex size-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/40 bg-white/40 text-zinc-500 transition-all hover:border-zinc-300 hover:bg-white hover:text-zinc-800 active:scale-90"
				aria-label="Voltar para agenda"
			>
				<ChevronLeft size={20} strokeWidth={2.5} />
			</button>
			<h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Mais</h1>
		</div>
	</div>

	<p class="section-label">conta</p>
	<div
		class="mx-4 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.01)] backdrop-blur-md"
	>
		<a
			href="/profile"
			class="group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-all duration-200 active:bg-zinc-50/70"
		>
			<div
				class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200/60 bg-zinc-100 shadow-sm ring-1 ring-zinc-950/[0.02]"
			>
				{#if avatarUrl}
					<img src={avatarUrl} alt={profile.name} class="h-full w-full object-cover" />
				{:else}
					<span class="text-sm font-bold text-zinc-500 uppercase">
						{initials}
					</span>
				{/if}
			</div>

			<div class="min-w-0 flex-1">
				<p class="truncate text-[15px] font-semibold tracking-tight text-zinc-900">
					{profile.name}
				</p>
				<p class="truncate text-[12.5px] font-medium text-zinc-400">coelo.dev/{profile.slug}</p>
			</div>
			<ChevronRight
				class="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
			/>
		</a>
	</div>

	<p class="section-label">configurações</p>
	<div
		class="mx-4 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.01)] backdrop-blur-md"
	>
		<a
			href="/configuracoes"
			class="group flex w-full items-center gap-3.5 border-b border-zinc-100 px-4 py-3.5 text-left transition-all duration-200 active:bg-zinc-50/70"
		>
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 text-zinc-600 transition-colors group-hover:bg-zinc-100 group-hover:text-zinc-900"
			>
				<CalendarCog class="size-4.5" />
			</div>
			<p
				class="flex-1 text-[14.5px] font-medium tracking-tight text-zinc-700 group-hover:text-zinc-900"
			>
				Ajustes da Agenda
			</p>
			<ChevronRight
				class="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
			/>
		</a>

		<a
			href="/servicos"
			class="group flex w-full items-center gap-3.5 border-b border-zinc-100 px-4 py-3.5 text-left transition-all duration-200 active:bg-zinc-50/70"
		>
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 text-zinc-600 transition-colors group-hover:bg-zinc-100 group-hover:text-zinc-900"
			>
				<BriefcaseBusiness class="size-4.5" />
			</div>
			<p
				class="flex-1 text-[14.5px] font-medium tracking-tight text-zinc-700 group-hover:text-zinc-900"
			>
				Serviços
			</p>
			<ChevronRight
				class="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
			/>
		</a>

		<a
			href="/rotina"
			class="group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-all duration-200 active:bg-zinc-50/70"
		>
			<div
				class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 text-zinc-600 transition-colors group-hover:bg-zinc-100 group-hover:text-zinc-900"
			>
				<Clock class="size-4.5" />
			</div>
			<p
				class="flex-1 text-[14.5px] font-medium tracking-tight text-zinc-700 group-hover:text-zinc-900"
			>
				Rotina Semanal
			</p>
			<ChevronRight
				class="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
			/>
		</a>
	</div>

	<p class="section-label">sessão</p>
	<div
		class="mx-4 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.01)] backdrop-blur-md"
	>
		<form method="POST" action="/logout" onsubmit={() => (isLoggingOut = true)}>
			<button
				type={confirmLogout ? 'submit' : 'button'}
				onclick={(e) => {
					if (!confirmLogout) {
						e.preventDefault();
						confirmLogout = true;
					}
				}}
				class="group flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-all duration-300 active:bg-zinc-50/70 {confirmLogout
					? 'bg-red-50/40'
					: ''}"
			>
				<div
					class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 text-zinc-500 transition-all duration-300 {confirmLogout
						? 'bg-red-100/70 text-red-600'
						: 'group-hover:bg-zinc-100 group-hover:text-zinc-800'}"
				>
					{#if isLoggingOut}
						<LoaderCircle class="size-4.5 animate-spin text-red-600" />
					{:else}
						<LogOut class="size-4.5" />
					{/if}
				</div>

				<div class="flex flex-1 flex-col">
					<p
						class="text-[14.5px] font-medium tracking-tight text-zinc-700 transition-colors duration-300 {confirmLogout
							? 'font-semibold text-red-600'
							: 'group-hover:text-zinc-900'}"
					>
						{#if isLoggingOut}
							Saindo...
						{:else if confirmLogout}
							Confirmar saída?
						{:else}
							Sair da conta
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
		font-size: 10.5px;
		font-weight: 600;
		letting-spacing: 0.1em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 16px 24px 7px;
		color: #a1a1aa; /* zinc-400 sutil */
	}
</style>
