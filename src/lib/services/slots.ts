// helpers/slots.ts

/**
 * @param date - String YYYY-MM-DD
 * @param duration - Duração em minutos (ex: 45)
 * @param daySchedule - { start: "09:00", end: "18:00", is_active: true }
 * @param lunch - { start: "12:00", end: "13:00", active: true }
 * @param bookedRanges - [ { start: "10:00", end: "10:30" }, ... ]
 */
export function generateSmartSlots(
	date: string,
	duration: number,
	daySchedule: any,
	lunch: any,
	bookedRanges: { start: string; end: string }[]
) {
	if (!daySchedule?.is_active) return [];

	const slots: string[] = [];
	const interval = 15; // Granularidade da agenda (ex: de 15 em 15 min)

	// 1. Converter tudo para minutos desde o início do dia para facilitar cálculos
	const toMin = (t: string) => {
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

	// Bloqueios convertidos
	const blocks = bookedRanges.map((r) => ({ s: toMin(r.start), e: toMin(r.end) }));

	if (lunch?.active) {
		blocks.push({ s: toMin(lunch.start), e: toMin(lunch.end) });
	}

	// 2. Iterar sobre o dia em passos de 15 min
	for (let current = startMin; current + duration <= endMin; current += interval) {
		const currentEnd = current + duration;

		// 3. A Mágica: O serviço "cabe" aqui?
		// Verifica se o intervalo [current, currentEnd] sobrepõe qualquer bloco
		const isOverlap = blocks.some((b) => {
			// Existe sobreposição se: (Início1 < Fim2) E (Fim1 > Início2)
			return current < b.e && currentEnd > b.s;
		});

		if (!isOverlap) {
			slots.push(fromMin(current));
		}
	}

	return slots;
}
