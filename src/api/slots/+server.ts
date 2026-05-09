import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { sql, user } }) => {
    if (!user) throw error(401, 'Não autorizado');

    const date = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId');

    if (!date || !serviceId) {
        throw error(400, 'Data e Serviço são obrigatórios');
    }

    try {
        // Busca o serviço para saber a duração e os agendamentos do dia
        const [service, existingAppointments] = await Promise.all([
            sql`SELECT duration FROM services WHERE id = ${serviceId} AND profile_id = ${user.id} LIMIT 1`.then(r => r[0]),
            sql`
                SELECT lower(slot) as start_at, upper(slot) as end_at 
                FROM appointments 
                WHERE profile_id = ${user.id} 
                  AND lower(slot)::date = ${date}::date
                  AND status != 'cancelled'
                ORDER BY lower(slot) ASC
            `
        ]);

        if (!service) throw error(404, 'Serviço não encontrado');

        const slots = gerarSlotsDisponiveis(date, service.duration, existingAppointments);

        return json({ slots });
    } catch (err) {
        console.error('[API Slots Error]:', err);
        throw error(500, 'Erro ao calcular horários');
    }
};

function gerarSlotsDisponiveis(date: string, duration: number, existing: any[]) {
    const slots = [];
    // Configuração de expediente (depois você pode buscar isso do profile)
    const startHour = 8;
    const endHour = 18;
    
    let current = new Date(`${date}T0${startHour}:00:00`);
    const endLimit = new Date(`${date}T${endHour}:00:00`);

    while (current < endLimit) {
        const slotStart = current.toTimeString().slice(0, 5);
        const slotEnd = new Date(current.getTime() + duration * 60000);
        const slotEndStr = slotEnd.toTimeString().slice(0, 5);
        
        // Regra de colisão: o novo slot não pode sobrepor nenhum existente
        const isOcupado = existing.some(app => {
            const appStart = new Date(app.start_at).toTimeString().slice(0, 5);
            const appEnd = new Date(app.end_at).toTimeString().slice(0, 5);
            return (slotStart < appEnd && slotEndStr > appStart);
        });

        if (!isOcupado) {
            slots.push({ slot_start: slotStart });
        }

        // Intervalo entre opções do grid (30 min)
        current = new Date(current.getTime() + 30 * 60000);
    }
    return slots;
}