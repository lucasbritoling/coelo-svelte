import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	try {
		// 1. Load paralelo com SQL nativo
		// O gte (greater than or equal) em SQL é >=
		const [workingHours, overrides] = await Promise.all([
			sql`
                SELECT id, day_of_week, start_time, end_time, is_active 
                FROM working_hours 
                WHERE profile_id = ${user.id} 
                ORDER BY day_of_week ASC
            `,
			sql`
                SELECT id, date, is_available, start_time, end_time, note 
                FROM availability_overrides 
                WHERE profile_id = ${user.id} 
                  AND date >= CURRENT_DATE
                ORDER BY date ASC
            `
		]);

		return {
			// O driver retorna objetos Date/Time.
			// Para o <input type="time">, precisamos de HH:mm
			workingHours: workingHours.map((wh) => ({
				...wh,
				start_time: wh.start_time?.slice(0, 5) ?? '09:00',
				end_time: wh.end_time?.slice(0, 5) ?? '18:00'
			})),
			overrides: overrides.map((ov) => ({
				...ov,
				// Formata data para yyyy-MM-dd para o <input type="date">
				date: ov.date instanceof Date ? ov.date.toISOString().split('T')[0] : ov.date,
				start_time: ov.start_time?.slice(0, 5) ?? null,
				end_time: ov.end_time?.slice(0, 5) ?? null
			}))
		};
	} catch (err) {
		console.error('Erro ao carregar horários:', err);
		throw error(500, 'Erro ao carregar agenda.');
	}
};

export const actions: Actions = {
	updateWorkingDay: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return fail(400, { message: 'ID ausente.' });

		const start_time = formData.get('start_time')?.toString() || '09:00';
		const end_time = formData.get('end_time')?.toString() || '18:00';
		const is_active = formData.has('is_active');

		try {
			await sql`
                UPDATE working_hours 
                SET 
                    start_time = ${start_time}, 
                    end_time = ${end_time}, 
                    is_active = ${is_active}
                WHERE id = ${id} AND profile_id = ${user.id}
            `;
			return { success: true };
		} catch (err: any) {
			// Tratamento da constraint valid_range check ((end_time > start_time))
			if (err.code === '23514') {
				return fail(400, { message: 'O horário de término deve ser maior que o de início.' });
			}
			return fail(500, { message: 'Erro ao atualizar horário.' });
		}
	},

	upsertOverride: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const date = formData.get('date')?.toString();
		const is_available = formData.has('is_available');

		if (!date) return fail(400, { message: 'Data obrigatória.' });

		try {
			const payload = {
				profile_id: user.id,
				date,
				is_available,
				start_time: is_available ? formData.get('start_time') : null,
				end_time: is_available ? formData.get('end_time') : null,
				note: formData.get('note')?.toString() || null
			};

			await sql`
                INSERT INTO availability_overrides ${sql(payload)}
                ON CONFLICT (profile_id, date) 
                DO UPDATE SET
                    is_available = EXCLUDED.is_available,
                    start_time = EXCLUDED.start_time,
                    end_time = EXCLUDED.end_time,
                    note = EXCLUDED.note
            `;
			return { success: true };
		} catch (err: any) {
			if (err.code === '23514') {
				return fail(400, { message: 'Horário inválido: término deve ser após o início.' });
			}
			return fail(500, { message: 'Erro ao salvar exceção.' });
		}
	},

	deleteOverride: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		try {
			await sql`
                DELETE FROM availability_overrides 
                WHERE id = ${id} AND profile_id = ${user.id}
            `;
			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro ao remover exceção.' });
		}
	}
};
