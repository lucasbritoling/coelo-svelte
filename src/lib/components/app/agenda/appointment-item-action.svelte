<script lang="ts">
	import {
		Pencil,
		CircleQuestionMark,
		CircleCheckBig,
		CircleSlash,
		Trash2,
		LoaderCircle
	} from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';

	let { appointmentId, appointmentStatus }: { appointmentId: string; appointmentStatus: string } =
		$props();

	let isDropdownOpen = $state(false);
	let isDeleting = $state(false);
	let isLoading = $state(false);
	let loadingStatus = $state<string | null>(null);
	let showConfirmDialog = $state(false);

	// Referência para o formulário fantasma e os inputs
	let statusForm: HTMLFormElement;
	let statusInput: HTMLInputElement;

	const statusOptions = [
		{ value: 'pending', label: 'Pendente', icon: CircleQuestionMark },
		{ value: 'confirmed', label: 'Confirmado', icon: CircleCheckBig },
		{ value: 'cancelled', label: 'Cancelado', icon: CircleSlash }
	] as const;

	// Função cirúrgica que executa tudo sem travar a requisição
	function handleStatusChange(targetStatus: string) {
		loadingStatus = targetStatus;
		isLoading = true;

		// 1. Fecha a interface visual imediatamente (Instantâneo)
		isDropdownOpen = false;

		// 2. Altera o valor no formulário fantasma fora do dropdown
		statusInput.value = targetStatus;

		// 3. Dispara o envio nativo que o use:enhance intercepta com segurança
		statusForm.requestSubmit();
	}
</script>

<!-- FORMULÁRIO FANTASMA (Fora do Dropdown, imune a desmontagens de DOM) -->
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
			{@const isCurrent = appointmentStatus === option.value}
			{@const isThisLoading = loadingStatus === option.value}

			<!-- Botão limpo, sem formulários em volta para serem destruídos pelo Bits UI -->
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

<!-- O restante do código do AlertDialog permanece intocado -->
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
					{#if isDeleting}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Excluir
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
