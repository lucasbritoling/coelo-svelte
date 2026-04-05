<script lang="ts">
	import { Ellipsis, Pencil, CircleCheckBig, Trash2, LoaderCircle } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { appointmentId }: { appointmentId: string } = $props();

	let isDeleting = $state(false);
	let isLoading = $state(false);
	let showConfirmDialog = $state(false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="size-8 text-muted-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent"
			>
				<Ellipsis class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="min-w-48">
		<form
			method="POST"
			action="?/confirm"
			use:enhance={() => {
				isLoading = true;
				return async ({ result, update }) => {
					if (result.type === 'success') {
						toast.success('Presença confirmada!');
						await update();
						isLoading = false;
					} else {
						toast.error('Erro ao confirmar presença.');
						isLoading = false;
					}
				};
			}}
		>
			<input type="hidden" name="id" value={appointmentId} />
			<button
				type="submit"
				disabled={isLoading}
				class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary transition-colors outline-none hover:bg-primary/10 disabled:opacity-50"
			>
				{#if isLoading}
					<LoaderCircle class="size-3.5 animate-spin" />
				{:else}
					<CircleCheckBig class="size-3.5" />
				{/if}
				<span>Confirmar presença</span>
			</button>
		</form>

		<DropdownMenu.Separator />

		<DropdownMenu.Item
			class="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
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
			<AlertDialog.Cancel disabled={isDeleting}>Cancelar</AlertDialog.Cancel>

			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isDeleting = true;

					return async ({ result, update }) => {
						// 1. Primeiro resolvemos a interface local (Rápido)
						isDeleting = false;

						if (result.type === 'success') {
							showConfirmDialog = false; // Fecha o modal logo
							toast.success('Agendamento removido.');

							// 2. Depois pedimos ao SvelteKit para atualizar os dados (Pode demorar)
							// Usamos { reset: true } para limpar o form se necessário
							await update({ reset: true });
						} else {
							// Se deu erro, mantemos o modal aberto para o usuário ver
							toast.error('Erro ao remover agendamento.');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={appointmentId} />
				<Button type="submit" variant="destructive" disabled={isDeleting} class="gap-2">
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
