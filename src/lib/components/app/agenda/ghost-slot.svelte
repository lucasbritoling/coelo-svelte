<script lang="ts">
	let { duration, startAt, onclick } = $props<{
		duration: number;
		startAt: string;
		onclick: () => void;
	}>();

	const label = $derived(
		duration >= 60
			? `${Math.floor(duration / 60)}h${duration % 60 || ''} livre`
			: `${duration} min livre`
	);
</script>

<button {onclick} class="ghost-slot-btn">
	<div class="content-group">
		<span class="time-stamp">{startAt}</span>
		<div class="divider-line"></div>
		<span class="label-text">{label}</span>
	</div>
	<div class="action-circle">
		<span class="plus-icon">+</span>
	</div>
</button>

<style>
	.ghost-slot-btn {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border-radius: 24px;
		border-width: 1px;
		border-style: dashed;
		border-color: rgb(228 228 231); /* zinc-200 */
		padding-top: 1rem;
		padding-bottom: 1rem;
		background-color: transparent;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
		cursor: pointer;
	}

	.ghost-slot-btn:hover {
		border-color: rgb(212 212 216); /* zinc-300 */
		background-color: rgb(250 250 250); /* zinc-50 */
	}

	.ghost-slot-btn:active {
		transform: scale(0.98);
	}

	.content-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgb(161 161 170); /* zinc-400 */
		transition-color: 150ms;
	}

	.ghost-slot-btn:hover .content-group {
		color: rgb(113 113 122); /* zinc-500 */
	}

	.time-stamp {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.divider-line {
		height: 1px;
		width: 1rem;
		background-color: rgb(228 228 231); /* zinc-200 */
	}

	.label-text {
		font-size: 0.75rem;
		font-weight: 500;
	}

	.action-circle {
		display: flex;
		height: 1.5rem;
		width: 1.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background-color: rgb(244 244 245); /* zinc-100 */
		color: rgb(161 161 170); /* zinc-400 */
		transition-property: all;
		transition-duration: 150ms;
	}

	.ghost-slot-btn:hover .action-circle {
		background-color: rgb(228 228 231); /* zinc-200 */
		color: rgb(82 82 91); /* zinc-600 */
	}

	.plus-icon {
		font-size: 1.125rem;
		line-height: 1;
	}
</style>
