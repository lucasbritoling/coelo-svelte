/**
 * Gerador de Slots Inteligente com Telemetria de Debug
 */
export function generateSmartSlots(
	date: string,
	duration: number,
	daySchedule: any,
	lunch: any,
	bookedRanges: { start: string; end: string }[]
) {
	console.group(`⚙️ Motor de Slots: ${date}`);

	// 1. Validação de Entrada
	if (!daySchedule?.is_active) {
		console.warn('ℹ️ Dia inativo no cronograma.');
		console.groupEnd();
		return [];
	}

	const slots: string[] = [];
	const interval = 15;

	const toMin = (t: string) => {
		if (!t) return 0;
		const [h, m] = t.split(':').map(Number);
		return h * 60 + m;
	};

	const fromMin = (m: number) => {
		const h = Math.floor(m / 60)
			.toString()
			.padStart(2, '0');
		const min = (m % 60).toString().padStart(2, '0');
		return `${h}:${min}`;
	};

	const startMin = toMin(daySchedule.start_time);
	const endMin = toMin(daySchedule.end_time);

	console.log('📊 Configuração:', {
		janela: `${daySchedule.start_time} até ${daySchedule.end_time}`,
		minutos: `${startMin}min até ${endMin}min`,
		duracaoServico: `${duration}min`,
		intervaloPasso: `${interval}min`
	});

	// 2. Mapear Bloqueios (Agendamentos + Almoço)
	const blocks = bookedRanges.map((r) => ({
		s: toMin(r.start),
		e: toMin(r.end),
		origin: 'Agendamento'
	}));

	if (lunch?.has_lunch) {
		const lStart = toMin(lunch.lunch_start);
		const lEnd = toMin(lunch.lunch_end);
		blocks.push({ s: lStart, e: lEnd, origin: 'Almoço' });
		console.log(
			`🍴 Bloqueio de Almoço: ${lunch.lunch_start} - ${lunch.lunch_end} (${lStart}-${lEnd}min)`
		);
	}

	if (blocks.length > 0) {
		console.table(blocks);
	}

	// 3. Loop de Geração
	console.log('🚶 Iniciando varredura de horários...');

	for (let current = startMin; current + duration <= endMin; current += interval) {
		const currentEnd = current + duration;
		const slotLabel = fromMin(current);

		// Verifica se este slot colide com QUALQUER bloco
		const collision = blocks.find((b) => {
			// Lógica de colisão de intervalos:
			// O slot começa antes do fim do bloco E termina depois do início do bloco
			return current < b.e && currentEnd > b.s;
		});

		if (collision) {
			// Log opcional para slots descartados (comentado para não poluir muito)
			// console.debug(`  - Slot ${slotLabel} descartado: Colisão com ${collision.origin}`);
		} else {
			slots.push(slotLabel);
		}
	}

	console.log(`✅ Finalizado: ${slots.length} slots gerados.`);
	console.groupEnd();

	return slots;
}
