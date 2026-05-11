<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { enhance } from '$app/forms';
	import { LoaderCircle, Calendar as CalendarIcon, User, Briefcase } from '@lucide/svelte';

	// Importamos o componente B e o estado global de UI
	import TimePicker from '$lib/components/app/time-picker.svelte';
	import { ui } from '$lib/state/ui.svelte';

	let { data } = $props();

	// Estado do formulário usando Runes
	let formState = $state({
		customerId: '',
		serviceId: '',
		date: data.selectedDate || new Date().toISOString().split('T')[0],
		time: '',
		notes: ''
	});

	let isSubmitting = $state(false);

	// Sincronização com o estado global para o botão "voltar" nativo
	$effect(() => {
		ui.isModalOpen = ui.isAppointmentModalOpen;
	});
</script>

<Dialog.Root bind:open={ui.isAppointmentModalOpen}>
	<Dialog.Content class="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[425px]">
		<div class="border-b bg-muted/5 p-6">
			<Dialog.Title class="text-xl font-bold tracking-tight">Novo Agendamento</Dialog.Title>
			<Dialog.Description class="text-xs">
				Preencha os detalhes para reservar o horário.
			</Dialog.Description>
		</div>

		<form
			method="POST"
			action="?/createAppointment"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						ui.isAppointmentModalOpen = false;
						await update();
					}
				};
			}}
			class="no-scrollbar max-h-[70vh] space-y-6 overflow-y-auto p-6"
		>
			<div class="space-y-3">
				<div class="flex items-center gap-2 text-muted-foreground">
					<User class="size-4" />
					<Label class="text-xs font-bold tracking-wider uppercase">Cliente</Label>
				</div>
				<select
					name="customerId"
					bind:value={formState.customerId}
					class="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
					required
				>
					<option value="">Selecionar cliente...</option>
					{#each data.customers as customer}
						<option value={customer.id}>{customer.name}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-3">
				<div class="flex items-center gap-2 text-muted-foreground">
					<Briefcase class="size-4" />
					<Label class="text-xs font-bold tracking-wider uppercase">Serviço</Label>
				</div>
				<select
					name="serviceId"
					bind:value={formState.serviceId}
					class="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
					required
				>
					<option value="">Qual o serviço?</option>
					{#each data.services as service}
						<option value={service.id}>{service.name} ({service.duration}min)</option>
					{/each}
				</select>
			</div>

			<hr class="border-dashed" />

			<div class="space-y-5">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label class="text-[10px] font-bold text-muted-foreground uppercase">Data</Label>
						<Input type="date" name="date" bind:value={formState.date} class="h-10" />
					</div>

					<div class="space-y-2">
						<TimePicker {data} bind:formState />
						<input type="hidden" name="time" value={formState.time} />
					</div>
				</div>
			</div>

			<div class="space-y-2">
				<Label class="text-[10px] font-bold text-muted-foreground uppercase"
					>Observações (Opcional)</Label
				>
				<Textarea
					name="notes"
					bind:value={formState.notes}
					placeholder="Ex: Cliente prefere café sem açúcar"
					class="resize-none rounded-xl"
				/>
			</div>

			<div class="pt-4">
				<Button
					type="submit"
					disabled={isSubmitting || !formState.time || !formState.customerId}
					class="h-12 w-full rounded-xl text-base font-bold transition-all active:scale-[0.98]"
				>
					{#if isSubmitting}
						<LoaderCircle class="mr-2 size-5 animate-spin" />
						Agendando...
					{:else}
						Confirmar Agendamento
					{/if}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Esconde scrollbar mas mantém funcionalidade */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
