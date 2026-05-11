<script lang="ts">
	import { enhance } from '$app/forms';
	import { LoaderCircle, User, Briefcase, Clock, Calendar as CalendarIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { dateUtils } from '$lib/utils/date';

	// Props que vêm da página pai
	let {
		data,
		initialTime = '',
		onSuccess
	} = $props<{
		data: any;
		initialTime?: string;
		onSuccess: () => void;
	}>();

	// Estado do formulário com Runes
	let formState = $state({
		customerId: '',
		serviceId: '',
		date: data.selectedDate || dateUtils.today(),
		start_at: initialTime || '',
		notes: ''
	});

	let isSubmitting = $state(false);

	// Lógica reativa para encontrar o serviço selecionado e calcular o fim
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

<form
	method="POST"
	action="?/create"
	use:enhance={() => {
		isSubmitting = true;
		return async ({ result }) => {
			isSubmitting = false;
			if (result.type === 'success') onSuccess();
		};
	}}
	class="no-scrollbar flex flex-col space-y-6 p-6"
>
	<input type="hidden" name="end_at" value={end_at} />

	<div class="space-y-3">
		<div class="flex items-center gap-2 px-1 text-zinc-400">
			<User size={14} />
			<Label class="text-[10px] font-bold tracking-widest uppercase">Cliente</Label>
		</div>
		<select
			name="customer_id"
			bind:value={formState.customerId}
			class="h-12 w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 text-sm font-medium transition-all focus:border-zinc-300 focus:bg-white focus:ring-0"
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
						<div class="size-2 rounded-full" style="background: {service.color || '#e4e4e7'}"></div>
						<span class="text-sm font-bold">{service.name}</span>
					</div>
					<span class="text-xs opacity-60">{service.duration} min</span>
				</button>
			{/each}
			<input type="hidden" name="service_id" value={formState.serviceId} />
		</div>
	</div>

	<hr class="border-zinc-100" />

	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-2">
			<Label class="px-1 text-[10px] font-bold text-zinc-400 uppercase">Data</Label>
			<div class="relative">
				<Input
					type="date"
					name="date"
					bind:value={formState.date}
					class="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-10"
				/>
				<CalendarIcon size={14} class="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400" />
			</div>
		</div>

		<div class="space-y-2">
			<Label class="px-1 text-[10px] font-bold text-zinc-400 uppercase">Início</Label>
			<div class="relative">
				<Input
					type="time"
					name="start_at"
					bind:value={formState.start_at}
					class="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-10"
				/>
				<Clock size={14} class="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400" />
			</div>
		</div>
	</div>

	{#if end_at}
		<p class="text-center text-[11px] font-medium text-zinc-400">
			Término previsto às <span class="font-bold text-zinc-900">{end_at}</span>
		</p>
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
			class="h-14 w-full rounded-2xl bg-zinc-900 text-base font-bold shadow-lg transition-all active:scale-[0.97]"
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
