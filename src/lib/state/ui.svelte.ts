// src/lib/state/ui.svelte.ts
export const ui = $state({
	isModalOpen: false,
	isDatePickerOpen: false,
	selectedDate: '',
	closeAll() {
		this.isModalOpen = false;
		this.isDatePickerOpen = false;
	}
});
