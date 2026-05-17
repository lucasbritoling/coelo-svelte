<script lang="ts">
	import {
		Pencil,
		CircleQuestionMark,
		CircleCheckBig,
		Trash2,
		LoaderCircle,
		CircleSlash,
		Check
	} from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';

	let { appointmentId, appointmentStatus }: { appointmentId: string; appointmentStatus: string } =
		$props();

	let isDeleting = $state(false);
	let isLoading = $state(false);
	let loadingStatus = $state<string | null>(null);
	let showConfirmDialog = $state(false);
	let menuOpen = $state(false);

	const statusOptions = [
		{
			value: 'pending',
			label: 'Pendente',
			description: 'Aguardando confirmação',
			icon: CircleQuestionMark,
			color: 'text-amber-500',
			hoverBg: 'hover:bg-amber-500/8 hover:text-amber-600 dark:hover:text-amber-400'
		},
		{
			value: 'confirmed',
			label: 'Confirmado',
			description: 'Cliente confirmou presença',
			icon: CircleCheckBig,
			color: 'text-emerald-500',
			hoverBg: 'hover:bg-emerald-500/8 hover:text-emerald-600 dark:hover:text-emerald-400'
		},
		{
			value: 'cancelled',
			label: 'Cancelado',
			description: 'Atendimento não realizado',
			icon: CircleSlash,
			color: 'text-rose-500',
			hoverBg: 'hover:bg-rose-500/8 hover:text-rose-600 dark:hover:text-rose-400'
		}
	] as const;
</script>

<!-- Trigger + Dropdown -->
<DropdownMenu.Root bind:open={menuOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="size-8 cursor-pointer rounded-full text-muted-foreground transition-all duration-200
				       hover:bg-accent hover:text-foreground hover:shadow-sm
				       data-[state=open]:bg-accent data-[state=open]:text-foreground data-[state=open]:shadow-sm"
			>
				<Pencil class="size-3.5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content
		align="end"
		class="min-w-60 overflow-hidden rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl shadow-black/10 dark:shadow-black/30"
		sideOffset={8}
	>
		<!-- Header label -->
		<div class="mb-1 px-2 pt-1 pb-2">
			<p class="text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
				Alterar status
			</p>
		</div>

		{#each statusOptions as option}
			{@const isCurrent = appointmentStatus === option.value}
			{@const isThisLoading = loadingStatus === option.value}

			<form
				method="POST"
				action="?/setStatus"
				use:enhance={() => {
					isLoading = true;
					loadingStatus = option.value;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							menuOpen = false;
							await update();
						}
						isLoading = false;
						loadingStatus = null;
					};
				}}
			>
				<input type="hidden" name="id" value={appointmentId} />
				<input type="hidden" name="status" value={option.value} />

				<button
					type="submit"
					disabled={isLoading || isCurrent}
					class="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm
					       transition-all duration-150 disabled:cursor-default
					       {isCurrent ? 'bg-accent/60' : option.hoverBg}
					       {isLoading && !isThisLoading ? 'opacity-40' : ''}"
				>
					<!-- Icon -->
					<span
						class="flex size-7 shrink-0 items-center justify-center rounded-md
					             border border-border/50 bg-background shadow-sm
					             {isCurrent ? option.color : 'group-hover: text-muted-foreground' + option.color}
					             transition-colors duration-150"
					>
						{#if isThisLoading}
							<LoaderCircle class="size-3.5 animate-spin" />
						{:else}
							<option.icon class="size-3.5" />
						{/if}
					</span>

					<!-- Label + description -->
					<span class="flex flex-col items-start gap-0.5 text-left">
						<span class="leading-none font-medium {isCurrent ? 'text-foreground' : ''}">
							{option.label}
						</span>
						<span class="text-[11px] leading-none text-muted-foreground/70">
							{option.description}
						</span>
					</span>

					<!-- Current badge -->
					{#if isCurrent}
						<span
							class="ml-auto flex items-center gap-1 rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-foreground/50 uppercase"
						>
							<Check class="size-2.5" />
							atual
						</span>
					{/if}
				</button>
			</form>
		{/each}

		<!-- Separator -->
		<div class="mx-2 my-1.5 h-px bg-border/50"></div>

		<!-- Delete -->
		<DropdownMenu.Item
			class="group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm
			       text-rose-500/80 transition-all duration-150
			       hover:bg-rose-500/8 hover:text-rose-600 focus:bg-rose-500/8 focus:text-rose-600
			       dark:text-rose-400/70 dark:hover:text-rose-400"
			onSelect={() => (showConfirmDialog = true)}
		>
			<span
				class="flex size-7 shrink-0 items-center justify-center rounded-md
			             border border-border/50 bg-background text-rose-400
			             shadow-sm transition-colors duration-150"
			>
				<Trash2 class="size-3.5" />
			</span>
			<span class="flex flex-col items-start gap-0.5">
				<span class="leading-none font-medium">Excluir agendamento</span>
				<span class="text-[11px] leading-none text-rose-400/60">Ação permanente</span>
			</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Alert Dialog -->
<AlertDialog.Root bind:open={showConfirmDialog}>
	<AlertDialog.Content
		class="max-w-sm gap-0 overflow-hidden rounded-2xl border border-border/60 p-0 shadow-2xl"
	>
		<!-- Icon header -->
		<div class="flex flex-col items-center gap-3 bg-rose-500/5 px-6 pt-8 pb-6 text-center">
			<div
				class="flex size-12 items-center justify-center rounded-full bg-rose-500/10 ring-4 ring-rose-500/10"
			>
				<Trash2 class="size-5 text-rose-500" />
			</div>
			<div class="space-y-1">
				<AlertDialog.Title class="text-base font-semibold">Excluir agendamento?</AlertDialog.Title>
				<AlertDialog.Description class="text-[13px] text-muted-foreground">
					Esta ação não pode ser desfeita. O horário ficará disponível para outros clientes
					imediatamente.
				</AlertDialog.Description>
			</div>
		</div>

		<!-- Actions -->
		<AlertDialog.Footer class="flex flex-row gap-2 border-t border-border/50 bg-muted/30 px-6 py-4">
			<AlertDialog.Cancel
				disabled={isDeleting}
				class="h-9 flex-1 cursor-pointer rounded-lg border border-border/60 bg-background text-sm font-medium
				       transition-all hover:bg-accent disabled:opacity-50"
			>
				Cancelar
			</AlertDialog.Cancel>

			<form
				method="POST"
				action="?/delete"
				class="flex-1"
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
					disabled={isDeleting}
					class="h-9 w-full cursor-pointer rounded-lg bg-rose-500 text-sm font-medium text-white
					       shadow-sm shadow-rose-500/30 transition-all
					       hover:bg-rose-600 hover:shadow-rose-500/40
					       disabled:opacity-70"
				>
					{#if isDeleting}
						<LoaderCircle class="mr-1.5 size-3.5 animate-spin" />
						Aguarde...
					{:else}
						Confirmar exclusão
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
