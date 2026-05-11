import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	const [workingHours, services, profile] = await Promise.all([
		sql`
			SELECT id, day_of_week, start_time, end_time, is_active
			FROM working_hours
			WHERE profile_id = ${user.id}
			ORDER BY day_of_week ASC
		`,
		sql`
			SELECT id, name, duration, is_active, min_notice_hours, buffer_after_min
			FROM services
			WHERE profile_id = ${user.id}
			ORDER BY name ASC
		`,
		sql`SELECT username FROM profiles WHERE id = ${user.id}`.then((r) => r[0])
	]);

	return {
		workingHours: workingHours.map((wh) => ({
			...wh,
			start_time: wh.start_time?.slice(0, 5) ?? '09:00',
			end_time: wh.end_time?.slice(0, 5) ?? '18:00'
		})),
		services,
		username: profile?.username ?? ''
	};
};

export const actions: Actions = {
	updateWorkingDay: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		const start_time = fd.get('start_time')?.toString() || '09:00';
		const end_time = fd.get('end_time')?.toString() || '18:00';
		const is_active = fd.get('is_active') === 'true';

		if (!id) return fail(400, { message: 'ID ausente.' });

		try {
			await sql`
				UPDATE working_hours
				SET start_time = ${start_time}, end_time = ${end_time}, is_active = ${is_active}
				WHERE id = ${id} AND profile_id = ${user.id}
			`;
			return { success: true };
		} catch (e: any) {
			if (e.code === '23514') return fail(400, { message: 'Término deve ser maior que o início.' });
			return fail(500, { message: 'Erro interno ao salvar.' });
		}
	},

	upsertService: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const fd = await request.formData();
		const id = fd.get('id')?.toString() || null;
		const name = fd.get('name')?.toString().trim();
		const duration = Number(fd.get('duration'));
		const min_notice_hours = Number(fd.get('min_notice_hours') ?? 2);
		const buffer_after_min = Number(fd.get('buffer_after_min') ?? 0);

		if (!name) return fail(400, { message: 'Nome obrigatório.' });
		if (!duration || duration < 5) return fail(400, { message: 'Duração inválida.' });

		const payload: Record<string, any> = {
			name,
			duration,
			min_notice_hours,
			buffer_after_min,
			profile_id: user.id,
			is_active: true
		};
		if (id) payload.id = id;

		try {
			const [svc] = await sql`
				INSERT INTO services ${sql(payload)}
				ON CONFLICT (id) DO UPDATE SET
					name             = EXCLUDED.name,
					duration         = EXCLUDED.duration,
					min_notice_hours = EXCLUDED.min_notice_hours,
					buffer_after_min = EXCLUDED.buffer_after_min
				RETURNING id, name, duration, is_active, min_notice_hours, buffer_after_min
			`;
			return { success: true, service: svc };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Erro interno ao salvar serviço.' });
		}
	},

	toggleService: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const fd = await request.formData();
		const id = fd.get('id')?.toString();
		const is_active = fd.get('is_active') === 'true';

		await sql`
			UPDATE services SET is_active = ${is_active}
			WHERE id = ${id}::uuid AND profile_id = ${user.id}
		`;
		return { success: true };
	},

	deleteService: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const id = (await request.formData()).get('id')?.toString();
		if (!id) return fail(400);

		try {
			await sql`DELETE FROM services WHERE id = ${id}::uuid AND profile_id = ${user.id}`;
			return { success: true };
		} catch (e: any) {
			if (e.code === '23503')
				return fail(400, { message: 'Serviço vinculado a agendamentos existentes.' });
			return fail(500, { message: 'Erro interno ao excluir.' });
		}
	}
};
