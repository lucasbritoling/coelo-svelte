<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Calendar, UsersRound } from '@lucide/svelte';
	import { crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	const navItems = [
		{ title: 'Agenda', href: '/agenda', icon: Calendar },
		{ title: 'Clientes', href: '/clientes', icon: UsersRound }
	];

	function navigateTo(href: string) {
		if (page.url.pathname === href) return;
		goto(href, { replaceState: true, noScroll: true });
	}

	const [send, receive] = crossfade({
		duration: 280,
		easing: cubicOut
	});
</script>

<div class="nav-wrapper">
	<nav class="nav-bar">
		{#each navItems as item}
			{@const active = page.url.pathname === item.href}

			<button
				onclick={() => navigateTo(item.href)}
				class="nav-btn"
				class:active
				aria-current={active ? 'page' : undefined}
			>
				{#if active}
					<div class="pill" in:receive={{ key: 'pill' }} out:send={{ key: 'pill' }}></div>
				{/if}

				<span class="icon-wrap" class:active>
					<item.icon size={19} strokeWidth={active ? 2.5 : 1.8} />
				</span>

				<span class="label" class:active>{item.title}</span>
			</button>
		{/each}
	</nav>
</div>

<style>
	.nav-wrapper {
		pointer-events: none;
		position: fixed;
		right: 0;
		bottom: 1.75rem;
		left: 0;
		z-index: 50;
		display: flex;
		justify-content: center;
		padding: 0 1.5rem;
	}

	.nav-bar {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px;
		border-radius: 9999px;

		/* Glass surface - neutral */
		background: rgba(255, 255, 255, 0.75);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		border: 1px solid rgba(228, 228, 231, 0.8); /* zinc-200 */

		/* Layered shadow for depth */
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.04),
			0 8px 24px rgba(0, 0, 0, 0.08),
			0 24px 48px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .nav-bar {
		background: rgba(24, 24, 27, 0.82); /* zinc-900 */
		border-color: rgba(63, 63, 70, 0.7); /* zinc-700 */
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 8px 24px rgba(0, 0, 0, 0.4),
			0 24px 48px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.nav-btn {
		position: relative;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 10px 20px;
		border-radius: 9999px;
		border: none;
		background: transparent;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 200ms ease;
	}

	.nav-btn:active {
		transform: scale(0.93);
	}

	/* Shared pill layout - neutral */
	.pill {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		z-index: 0;

		background: linear-gradient(
			135deg,
			rgba(244, 244, 245, 0.95) 0%,
			/* zinc-100 */ rgba(228, 228, 231, 0.9) 100% /* zinc-200 */
		);
		border: 1px solid rgba(212, 212, 216, 0.8); /* zinc-300 */
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	:global(.dark) .pill {
		background: linear-gradient(
			135deg,
			rgba(63, 63, 70, 0.95) 0%,
			/* zinc-700 */ rgba(39, 39, 42, 0.92) 100% /* zinc-800 */
		);
		border-color: rgba(82, 82, 91, 0.8); /* zinc-600 */
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	/* Icon */
	.icon-wrap {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #a1a1aa; /* zinc-400 */
		transition: color 250ms ease;
	}

	.icon-wrap.active {
		color: #27272a; /* zinc-800 */
	}

	:global(.dark) .icon-wrap {
		color: #71717a; /* zinc-500 */
	}

	:global(.dark) .icon-wrap.active {
		color: #fafafa; /* zinc-50 */
	}

	/* Label */
	.label {
		position: relative;
		z-index: 1;
		font-size: 14.5px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: #a1a1aa; /* zinc-400 */
		transition: color 250ms ease;
		line-height: 1;
	}

	.label.active {
		color: #18181b; /* zinc-900 */
	}

	:global(.dark) .label {
		color: #71717a; /* zinc-500 */
	}

	:global(.dark) .label.active {
		color: #fafafa; /* zinc-50 */
	}
</style>
