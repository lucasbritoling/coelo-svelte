<script lang="ts">
	import {
		Pencil,
		CircleQuestionMark,
		CircleCheckBig,
		CircleSlash,
		Trash2,
		LoaderCircle,
		CalendarClock
	} from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import type { Appointment } from '$lib/types/appointment';

	// MODIFICADO: Agora recebe o callback onStatusChange para atualizar o pai imediatamente
	let {
		appt,
		onReschedule,
		onStatusChange
	}: {
		appt: Appointment;
		onReschedule: () => void;
		onStatusChange: (status: string) => void;
	} = $props();

	const appointmentId = appt.id;

	// Estado local otimista para o dropdown saber o status atualizado imediatamente
	let activeStatus = $state(appt.status);

	let isDropdownOpen = $state(false);
	let isDeleting = $state(false);
	let isLoading = $state(false);
	let loadingStatus = $state<string | null>(null);
	let showConfirmDialog = $state(false);

	let statusForm: HTMLFormElement;
	let statusInput: HTMLInputElement;

	const statusOptions = [
		{ value: 'pending', label: 'Pendente', icon: CircleQuestionMark },
		{ value: 'confirmed', label: 'Confirmado', icon: CircleCheckBig },
		{ value: 'cancelled', label: 'Cancelado', icon: CircleSlash }
	] as const;

	// Sincroniza o estado caso venha alguma alteração externa do banco
	$effect(() => {
		activeStatus = appt.status;
	});

	function handleStatusChange(targetStatus: string) {
		loadingStatus = targetStatus;
		isLoading = true;
		isDropdownOpen = false;

		// ── DISPARO OTIMISTA ─────────────────────────────────────────────
		activeStatus = targetStatus; // Atualiza o dropdown local
		onStatusChange(targetStatus); // Notifica o card pai imediatamente
		// ─────────────────────────────────────────────────────────────────

		statusInput.value = targetStatus;
		statusForm.requestSubmit();
	}
</script>

<form
	bind:this={statusForm}
	method="POST"
	action="?/setStatus"
	class="hidden"
	use:enhance={() => {
		return async ({ result, update }) => {
			isLoading = false;
			loadingStatus = null;

			if (result.type === 'success') {
				await update();
			} else {
				// ROLLBACK: Se der erro no banco, reverte para o estado original
				activeStatus = appt.status;
				onStatusChange(appt.status);
			}
		};
	}}
>
	<input type="hidden" name="id" value={appointmentId} />
	<input type="hidden" name="status" bind:this={statusInput} value="" />
</form>

<DropdownMenu.Root bind:open={isDropdownOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="h-8 w-8">
				<Pencil class="h-4 w-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-44 p-1">
		{#each statusOptions as option}
			{@const isCurrent = activeStatus === option.value}
			{@const isThisLoading = loadingStatus === option.value}

			<button
				type="button"
				disabled={isLoading || isCurrent}
				onclick={() => handleStatusChange(option.value)}
				class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
			>
				{#if isThisLoading}
					<LoaderCircle class="h-4 w-4 animate-spin" />
				{:else}
					<option.icon class="h-4 w-4" />
				{/if}
				<span class="flex-1 text-left">{option.label}</span>
				{#if isCurrent}
					<span class="text-xs text-muted-foreground">Atual</span>
				{/if}
			</button>
		{/each}

		<DropdownMenu.Separator />

		<DropdownMenu.Item
			onSelect={() => {
				onReschedule();
				isDropdownOpen = false;
			}}
		>
			<CalendarClock class="mr-2 ml-0.5 h-4 w-4" />
			Reagendar
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<DropdownMenu.Item
			class="text-destructive focus:text-destructive"
			onSelect={() => {
				showConfirmDialog = true;
				isDropdownOpen = false;
			}}
		>
			<Trash2 class="mr-2 h-4 w-4" />
			Excluir
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<AlertDialog.Root bind:open={showConfirmDialog}>
	<AlertDialog.Content class="max-w-sm text-center">
		<AlertDialog.Header class="items-center text-center">
			<AlertDialog.Title>Excluir agendamento?</AlertDialog.Title>
			<AlertDialog.Description class="text-justify">
				Essa ação não pode ser desfeita.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="items-center justify-center gap-2 text-center">
			<AlertDialog.Cancel class="w-28 justify-center text-center" disabled={isDeleting}>
				Cancelar
			</AlertDialog.Cancel>

			<form
				method="POST"
				action="?/delete"
				class="m-0"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result, update }) => {
						isDeleting = false;
						if (result.type === 'success') {
							showConfirmDialog = false;
							await update({ reset: true });
						}
					};
				}}
			>
				<input type="hidden" name="id" value={appointmentId} />
				<Button
					type="submit"
					variant="destructive"
					class="w-28 justify-center text-center"
					disabled={isDeleting}
				>
					{#if isDeleting}<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />{/if}
					Excluir
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
