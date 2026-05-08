<script lang="ts">
	import {
		Pencil,
		CircleQuestionMark,
		CircleCheckBig,
		Trash2,
		LoaderCircle,
		CircleSlash
	} from '@lucide/svelte';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';

	let { appointmentId, appointmentStatus }: { appointmentId: string; appointmentStatus: string } =
		$props();

	let isDeleting = $state(false);
	let isLoading = $state(false);
	let showConfirmDialog = $state(false);
	let menuOpen = $state(false);

	const statusOptions = [
		{
			value: 'pending',
			label: 'Marcar pendente',
			icon: CircleQuestionMark,
			class: 'hover:bg-accent cursor-pointer'
		},
		{
			value: 'confirmed',
			label: 'Marcar confirmado',
			icon: CircleCheckBig,
			class: 'hover:bg-emerald-500/10 hover:text-emerald-600 cursor-pointer'
		},
		{
			value: 'cancelled',
			label: 'Marcar cancelado',
			icon: CircleSlash,
			class: 'hover:bg-destructive/10 hover:text-destructive cursor-pointer'
		}
	] as const;
</script>

<DropdownMenu.Root bind:open={menuOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="size-8 cursor-pointer text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=open]:bg-accent"
			>
				<Pencil class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="min-w-56">
		{#each statusOptions as option}
			<form
				method="POST"
				action="?/setStatus"
				use:enhance={() => {
					isLoading = true;

					return async ({ result, update }) => {
						if (result.type === 'success') {
							menuOpen = false;
							await update();
						}

						isLoading = false;
					};
				}}
			>
				<input type="hidden" name="id" value={appointmentId} />
				<input type="hidden" name="status" value={option.value} />

				<button
					type="submit"
					disabled={isLoading || appointmentStatus === option.value}
					class={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors disabled:cursor-default disabled:opacity-50 ${option.class}`}
				>
					{#if isLoading && appointmentStatus !== option.value}
						<LoaderCircle class="size-3.5 animate-spin" />
					{:else}
						<option.icon class="size-3.5" />
					{/if}

					<span>{option.label}</span>

					{#if appointmentStatus === option.value}
						<span class="ml-auto text-[10px] font-semibold tracking-wide uppercase opacity-50">
							atual
						</span>
					{/if}
				</button>
			</form>
		{/each}

		<DropdownMenu.Separator />

		<DropdownMenu.Item
			class="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
			onSelect={() => (showConfirmDialog = true)}
		>
			<Trash2 class="size-3.5" />
			<span>Excluir</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<AlertDialog.Root bind:open={showConfirmDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Excluir agendamento?</AlertDialog.Title>

			<AlertDialog.Description>
				Esta ação não pode ser desfeita. O horário ficará disponível para outros clientes
				imediatamente.
			</AlertDialog.Description>
		</AlertDialog.Header>

		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isDeleting} class="cursor-pointer">Cancelar</AlertDialog.Cancel>

			<form
				method="POST"
				action="?/delete"
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
					disabled={isDeleting}
					class="cursor-pointer gap-2"
				>
					{#if isDeleting}
						<LoaderCircle class="size-3.5 animate-spin" />
						Aguarde...
					{:else}
						Confirmar Exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
