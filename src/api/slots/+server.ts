import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { sql, user } }) => {
	if (!user) throw error(401, 'Não autorizado');

	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');
	const excludeId = url.searchParams.get('excludeId'); // Opcional para reagendamento

	if (!date || !serviceId) throw error(400, 'Parâmetros insuficientes');

	try {
		// 1. Busca os dados necessários: Serviço e Horários de Trabalho
		const [service, availability, existingApps] = await Promise.all([
			sql`SELECT duration FROM services WHERE id = ${serviceId} AND profile_id = ${user.id} LIMIT 1`.then(
				(r) => r[0]
			),

			// Busca override ou horário padrão em uma única consulta lógica
			sql`
                WITH override AS (
                    SELECT is_available, start_time, end_time 
                    FROM availability_overrides 
                    WHERE profile_id = ${user.id} AND date = ${date}::date
                ),
                regular AS (
                    SELECT is_active as is_available, start_time, end_time 
                    FROM working_hours 
                    WHERE profile_id = ${user.id} AND day_of_week = extract(dow from ${date}::date)
                )
                SELECT * FROM override
                UNION ALL
                SELECT * FROM regular WHERE NOT EXISTS (SELECT 1 FROM override)
            `.then((r) => r[0]),

			// Busca agendamentos excluindo o ID que está sendo editado
			sql`
                SELECT lower(slot) as start_at, upper(slot) as end_at 
                FROM appointments 
                WHERE profile_id = ${user.id} 
                  AND lower(slot)::date = ${date}::date
                  AND status != 'cancelled'
                  ${excludeId ? sql`AND id != ${excludeId}` : sql``}
            `
		]);

		if (!service || !availability || !availability.is_available) {
			return json({ slots: [] });
		}

		// 2. Gerar slots baseados na lógica da sua function
		const slots = gerarSlots(
			date,
			service.duration,
			availability.start_time,
			availability.end_time,
			existingApps
		);

		return json({ slots });
	} catch (err) {
		console.error('[API Slots Error]:', err);
		throw error(500, 'Erro interno');
	}
};

function gerarSlots(date: string, duration: number, start: string, end: string, existing: any[]) {
	const slots = [];
	const now = new Date();
	// Offset para America/Sao_Paulo (ajuste conforme necessário)
	const brazilNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

	let current = new Date(`${date}T${start}`);
	const endLimit = new Date(`${date}T${end}`);

	while (new Date(current.getTime() + duration * 60000) <= endLimit) {
		const slotStart = current;
		const slotEnd = new Date(current.getTime() + duration * 60000);

		const slotStartStr = slotStart.toTimeString().slice(0, 5);
		const slotEndStr = slotEnd.toTimeString().slice(0, 5);

		// Trava de horários passados
		if (slotStart < brazilNow) {
			current = new Date(current.getTime() + duration * 60000);
			continue;
		}

		// Verifica colisão
		const isOcupado = existing.some((app) => {
			const appStart = new Date(app.start_at).toTimeString().slice(0, 5);
			const appEnd = new Date(app.end_at).toTimeString().slice(0, 5);
			return slotStartStr < appEnd && slotEndStr > appStart;
		});

		if (!isOcupado) {
			slots.push({ slot_start: slotStartStr, slot_end: slotEndStr });
		}

		// Avança conforme a duração do serviço (ou use 30 min para grid fixo)
		current = new Date(current.getTime() + duration * 60000);
	}
	return slots;
}
