<script lang="ts">
	import { fly } from 'svelte/transition';
	import {
		ChevronLeft,
		CalendarCog,
		BriefcaseBusiness,
		Clock,
		Wallet,
		Package,
		Crown
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import NavLink from '$lib/components/app/mais/NavLink.svelte';
	import LogoutButton from '$lib/components/app/mais/LogoutButton.svelte';

	let { data } = $props();
</script>

<div class="mx-auto flex min-h-full max-w-xl flex-col pb-28" in:fly={{ x: -16, duration: 250 }}>
	<div class="flex items-center gap-3 px-6 pt-8 pb-3">
		<button
			onclick={() => goto('/agenda')}
			class="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-200/40 bg-white/40 text-zinc-500 hover:bg-white active:scale-90"
		>
			<ChevronLeft size={20} />
		</button>
		<h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Mais</h1>
	</div>

	<p class="px-6 pt-4 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
		conta
	</p>
	<div
		class="mx-4 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 shadow-sm backdrop-blur-md"
	>
		<a href="/profile" class="group flex w-full items-center gap-3.5 px-4 py-3.5">
			<div
				class="flex size-11 items-center justify-center overflow-hidden rounded-full border border-zinc-200/60 bg-zinc-100"
			>
				{#if data.user?.avatar_url}
					<img src={data.user.avatar_url} alt="" class="size-full object-cover" />
				{:else}
					<span class="text-sm font-bold text-zinc-500">{data.user?.full_name?.[0] ?? '?'}</span>
				{/if}
			</div>
			<div class="flex-1 truncate">
				<p class="text-[15px] font-semibold text-zinc-900">{data.user?.full_name ?? 'Usuário'}</p>
				<p class="text-[12.5px] font-medium text-zinc-400">
					coelo.dev/{data.user?.username ?? 'username'}
				</p>
			</div>
		</a>
	</div>

	<p class="px-6 pt-4 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
		configurações
	</p>
	<div
		class="mx-4 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 shadow-sm backdrop-blur-md"
	>
		<NavLink href="/configuracoes" icon={CalendarCog}>Ajustes da Agenda</NavLink>
		<NavLink href="/servicos" icon={BriefcaseBusiness}>Serviços</NavLink>
		<NavLink href="/rotina" icon={Clock}>Rotina Semanal</NavLink>
	</div>

	<p class="px-6 pt-4 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
		premium
	</p>
	<div
		class="mx-4 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 shadow-sm backdrop-blur-md"
	>
		<NavLink href="/estoque" icon={Package}>
			Estoque
			<Crown class="ml-2 inline size-3 text-amber-500" />
		</NavLink>
		<NavLink href="/financeiro" icon={Wallet}>
			Financeiro
			<Crown class="ml-2 inline size-3 text-amber-500" />
		</NavLink>
	</div>

	<p class="px-6 pt-4 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
		sessão
	</p>
	<div
		class="mx-4 overflow-hidden rounded-[22px] border border-zinc-200/50 bg-white/70 shadow-sm backdrop-blur-md"
	>
		<LogoutButton />
	</div>
</div>
