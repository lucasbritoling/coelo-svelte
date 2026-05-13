<script lang="ts">
	import { enhance } from '$app/forms';
	import { LoaderCircle, User, Briefcase, Clock, Calendar as CalendarIcon } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { dateUtils } from '$lib/utils/date';

	// Props
	let {
		data,
		open = $bindable(), // Permite que o pai feche o modal ou reaja à abertura
		initialTime = '',
		onSuccess
	} = $props<{
		data: any;
		open: boolean;
		initialTime?: string;
		onSuccess: () => void;
	}>();

	// Estado do formulário
	let formState = $state({
		customerId: '',
		serviceId: '',
		date: data.selectedDate || dateUtils.today(),
		start_at: '',
		notes: ''
	});

	// Sincroniza o initialTime quando ele muda (ex: clique em Ghost Slot)
	$effect(() => {
		if (open) {
			formState.start_at = initialTime;
			formState.date = data.selectedDate || dateUtils.today();
		}
	});

	let isSubmitting = $state(false);

	const selectedService = $derived(data.services.find((s) => s.id === formState.serviceId));

	const end_at = $derived.by(() => {
		if (!formState.start_at || !selectedService) return '';
		const [h, m] = formState.start_at.split(':').map(Number);
		const totalMinutes = h * 60 + m + selectedService.duration;
		const fh = Math.floor(totalMinutes / 60)
			.toString()
			.padStart(2, '0');
		const fm = (totalMinutes % 60).toString().padStart(2, '0');
		return `${fh}:${fm}`;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[92dvh] w-[94vw] flex-col overflow-hidden rounded-[32px] p-0 shadow-2xl sm:max-w-[450px]"
	>
		<div class="border-b px-6 py-5">
			<h2 class="text-xl font-bold">Novo Agendamento</h2>
			<p class="text-sm text-zinc-500 capitalize">
				{dateUtils.getHeaderLabel(data.selectedDate)}
			</p>
		</div>

		<div class="no-scrollbar overflow-y-auto">
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'success') {
							onSuccess();
							open = false;
						}
					};
				}}
				class="flex flex-col space-y-6 p-6 pt-0 pb-4"
			>
				<input type="hidden" name="end_at" value={end_at} />
				<input type="hidden" name="date" value={formState.date} />

				<div class="space-y-3">
					<div class="flex items-center gap-2 px-1 text-zinc-400">
						<User size={14} />
						<Label class="text-[10px] font-bold tracking-widest uppercase">Cliente</Label>
					</div>
					<select
						name="customer_id"
						bind:value={formState.customerId}
						class="h-12 w-full appearance-none rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 text-sm font-medium transition-all focus:border-zinc-300 focus:bg-white focus:ring-0"
						required
					>
						<option value="">Quem vai atender?</option>
						{#each data.customers as customer}
							<option value={customer.id}>{customer.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-2 px-1 text-zinc-400">
						<Briefcase size={14} />
						<Label class="text-[10px] font-bold tracking-widest uppercase">Serviço</Label>
					</div>
					<div class="grid grid-cols-1 gap-2">
						{#each data.services as service}
							<button
								type="button"
								onclick={() => (formState.serviceId = service.id)}
								class="flex items-center justify-between rounded-2xl border px-4 py-3 transition-all
                                {formState.serviceId === service.id
									? 'border-zinc-900 bg-zinc-900 text-white'
									: 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200'}"
							>
								<div class="flex items-center gap-3">
									<div
										class="size-2 rounded-full"
										style="background: {service.color || '#e4e4e7'}"
									></div>
									<span class="text-sm font-bold">{service.name}</span>
								</div>
								<span class="text-xs opacity-60">{service.duration} min</span>
							</button>
						{/each}
						<input type="hidden" name="service_id" value={formState.serviceId} />
					</div>
				</div>

				<hr class="border-zinc-100" />

				<div class="space-y-2">
					<Label class="px-1 text-[10px] font-bold text-zinc-400 uppercase"
						>Início do Atendimento</Label
					>
					<div class="relative">
						<Input
							type="time"
							name="start_at"
							bind:value={formState.start_at}
							class="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-10 text-base"
						/>
						<Clock size={16} class="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400" />
					</div>
				</div>

				{#if end_at}
					<div class="rounded-2xl bg-zinc-50 py-3 text-center transition-all">
						<p class="text-[11px] font-medium text-zinc-500">
							Término previsto às <span class="text-sm font-bold text-zinc-900">{end_at}</span>
						</p>
					</div>
				{/if}

				<div class="space-y-2">
					<Label class="px-1 text-[10px] font-bold text-zinc-400 uppercase">Notas</Label>
					<Textarea
						name="notes"
						bind:value={formState.notes}
						placeholder="Algum detalhe importante?"
						class="min-h-[80px] resize-none rounded-2xl border-zinc-100 bg-zinc-50/50"
					/>
				</div>

				<div class="pt-2">
					<Button
						type="submit"
						disabled={isSubmitting ||
							!formState.start_at ||
							!formState.customerId ||
							!formState.serviceId}
						class="h-14 w-full rounded-[20px] bg-zinc-900 text-base font-bold shadow-lg transition-all active:scale-[0.97]"
					>
						{#if isSubmitting}
							<LoaderCircle class="mr-2 size-5 animate-spin" />
							Salvando...
						{:else}
							Agendar Horário
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
