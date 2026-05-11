<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { generateSmartSlots } from '$lib/services/slots.ts';

	// Recebemos o data (com agendamentos e regras) e o formState (bindable)
	let { data, formState = $bindable() } = $props();

	// 1. Derivamos a duração do serviço selecionado
	const serviceDuration = $derived(
		data.services.find((s) => s.id === formState.serviceId)?.duration ?? 0
	);

	// 2. Filtramos os agendamentos já existentes para a data no front (Performance!)
	const dailyBookedRanges = $derived(
		data.appointments
			?.filter((a) => a.date === formState.date && a.status !== 'cancelled')
			.map((a) => ({ start: a.start_at, end: a.end_at })) ?? []
	);

	// 3. Helper para pegar o dia da semana (0-6)
	function getDayOfWeek(dateStr: string) {
		if (!dateStr) return 0;
		const [y, m, d] = dateStr.split('-').map(Number);
		return new Date(y, m - 1, d).getDay();
	}

	// 4. O MOTOR: Gera os chips de sugestão sempre que algo mudar
	const suggestedSlots = $derived.by(() => {
		if (!formState.serviceId || !formState.date) return [];

		const dayOfWeek = getDayOfWeek(formState.date);
		const schedule = data.workingHours.find((wh) => wh.day_of_week === dayOfWeek);

		return generateSmartSlots(
			formState.date,
			serviceDuration,
			schedule,
			data.user?.lunch_settings, // Assumindo que vem no data do user
			dailyBookedRanges
		);
	});

	// 5. Estado visual: dia cheio?
	const isDayFull = $derived(formState.serviceId && suggestedSlots.length === 0);
</script>

<div class="space-y-2">
	<Label class="text-[10px] font-bold text-muted-foreground uppercase">Horário</Label>

	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<Input type="time" bind:value={formState.time} class="h-10 w-[110px] shrink-0 font-medium" />

			{#if suggestedSlots.length > 0}
				<div class="no-scrollbar flex flex-1 animate-in gap-2 overflow-x-auto pb-1 fade-in">
					{#each suggestedSlots.slice(0, 8) as slot}
						<button
							type="button"
							onclick={() => (formState.time = slot)}
							class="
                                h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition-all
                                active:scale-95
                                {formState.time === slot
								? 'border-primary bg-primary text-primary-foreground'
								: 'bg-zinc-100/50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/50'}
                            "
						>
							{slot}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex min-h-[16px] items-center gap-1.5 px-1">
			{#if !formState.serviceId}
				<span class="text-[10px] text-muted-foreground italic"
					>Selecione um serviço para ver vagas</span
				>
			{:else if isDayFull}
				<div class="flex animate-pulse items-center gap-1.5 text-red-600">
					<div class="size-1.5 rounded-full bg-current"></div>
					<span class="text-[10px] font-bold">Sem vagas para este serviço hoje</span>
				</div>
			{:else}
				<div class="flex items-center gap-1.5 text-emerald-600">
					<div class="size-1.5 rounded-full bg-current"></div>
					<span class="text-[10px] font-bold">{suggestedSlots.length} horários disponíveis</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Estilo para garantir que o scroll horizontal seja fluido no mobile */
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
