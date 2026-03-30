<script lang="ts">
	import { MoreHorizontal, Edit2, CheckCircle, Trash2, Loader2 } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { appointmentId }: { appointmentId: string } = $props();

	let isDeleting = $state(false);
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
				<MoreHorizontal class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="min-w-48">
		<DropdownMenu.Item class="gap-2" onclick={() => console.log('Editar', appointmentId)}>
			<Edit2 class="size-3.5 opacity-70" />
			<span>Editar agendamento</span>
		</DropdownMenu.Item>

		<DropdownMenu.Item class="gap-2 text-primary focus:text-primary">
			<CheckCircle class="size-3.5" />
			<span>Confirmar presença</span>
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				if (!confirm('Deseja realmente cancelar este agendamento?')) return;

				isDeleting = true;

				return async ({ result }) => {
					isDeleting = false;
					if (result.type === 'success') {
						toast.success('Agendamento removido.');
					} else {
						toast.error('Erro ao remover agendamento.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={appointmentId} />
			<button
				type="submit"
				disabled={isDeleting}
				class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive transition-colors outline-none hover:bg-destructive/10 disabled:opacity-50"
			>
				{#if isDeleting}
					<Loader2 class="size-3.5 animate-spin" />
					<span>Cancelando...</span>
				{:else}
					<Trash2 class="size-3.5" />
					<span>Cancelar horário</span>
				{/if}
			</button>
		</form>
	</DropdownMenu.Content>
</DropdownMenu.Root>
