<script lang="ts">
	import { generateSmartSlots } from '$lib/services/slots.ts';

	let {
		data,
		start_at = $bindable(),
		selectedDate,
		serviceId
	} = $props<{
		data: any;
		start_at: string;
		selectedDate: string;
		serviceId: string;
	}>();

	// 1. Identificação da Duração do Serviço
	const serviceDuration = $derived.by(() => {
		if (!data?.services || !Array.isArray(data.services) || !serviceId) return 0;
		const service = data.services.find((s: any) => String(s.id) === String(serviceId));
		return service?.duration ?? 0;
	});

	// 2. Mapeamento de bloqueios (Agendamentos já existentes)
	const dailyBookedRanges = $derived.by(() => {
		const appointments = data?.appointments;
		if (!appointments || !Array.isArray(appointments)) return [];

		const blockingStatuses = ['pending', 'confirmed'];

		// Nota: Removi o filtro "a.date === selectedDate" pois sua query SQL
		// já filtra por data no servidor. Mantemos apenas o filtro de status.
		return appointments
			.filter((a: any) => blockingStatuses.includes(a.status))
			.map((a: any) => ({
				start: a.start_at,
				end: a.end_at
			}));
	});

	function getDayOfWeek(dateStr: string) {
		if (!dateStr) return 0;
		const [y, m, d] = dateStr.split('-').map(Number);
		// Retorna 0 (Dom) a 6 (Sáb)
		return new Date(y, m - 1, d).getDay();
	}

	// 3. O Motor Reativo
	const suggestedSlots = $derived.by(() => {
		// Validação de sanidade inicial
		const isDataReady = !!data && Array.isArray(data?.workingHours);

		if (!serviceId || !selectedDate || !isDataReady) {
			console.warn('⚠️ Abortado: Dados insuficientes para gerar slots.');
			console.groupEnd();
			return [];
		}

		const dayOfWeek = getDayOfWeek(selectedDate);
		const schedule = data.workingHours.find((wh: any) => Number(wh.day_of_week) === dayOfWeek);

		if (!schedule || !schedule.is_active) {
			console.warn(`❌ Sem expediente configurado ou ativo para o dia da semana: ${dayOfWeek}`);
			console.groupEnd();
			return [];
		}

		try {
			// Chamada ao serviço com tratamento de erro
			const result = generateSmartSlots(
				selectedDate,
				serviceDuration,
				schedule,
				data.user?.lunch_settings,
				dailyBookedRanges
			);
			return result;
		} catch (e) {
			return [];
		}
	});

	const isDayFull = $derived(serviceId && suggestedSlots.length === 0);
</script>

<div class="flex h-full items-center">
	{#if !serviceId}
		<span class="animate-in px-1 text-[10px] text-zinc-400 italic duration-500 fade-in">
			Selecione um serviço para ver horários
		</span>
	{:else if isDayFull}
		<div class="flex animate-in items-center gap-1.5 px-1 text-red-500 duration-300 zoom-in-95">
			<div class="size-1 rounded-full bg-current"></div>
			<span class="text-[10px] font-bold tracking-tight uppercase">Sem vagas hoje</span>
		</div>
	{:else}
		<div class="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto pb-0.5">
			{#each suggestedSlots as slot}
				<button
					type="button"
					onclick={() => (start_at = slot)}
					class="
                        h-7 shrink-0 rounded-full border px-3 text-[10px] font-bold transition-all
                        active:scale-95
                        {start_at === slot
						? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
						: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'}
                    "
				>
					{slot}
				</button>
			{/each}

			{#if suggestedSlots.length > 0}
				<span class="shrink-0 pr-2 text-[9px] font-medium text-emerald-600 uppercase">
					{suggestedSlots.length} vagas
				</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
