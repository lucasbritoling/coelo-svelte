// src/lib/state/ui.svelte.ts
export const ui = $state({
	isModalOpen: false,
	closeAll() {
		this.isModalOpen = false;
	}
});
