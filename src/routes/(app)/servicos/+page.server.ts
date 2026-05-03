import { fail, error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { serviceSchema } from '$lib/schemas/app';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	try {
		// Consultas paralelas: SQL nativo + Validação do form
		const [services, form] = await Promise.all([
			sql`
                SELECT * FROM services 
                WHERE profile_id = ${user.id} 
                ORDER BY name ASC
            `,
			superValidate(zod4(serviceSchema))
		]);

		return { services, form };
	} catch (err) {
		console.error('Erro ao carregar serviços:', err);
		throw error(500, 'Erro ao carregar dados do banco.');
	}
};

export const actions: Actions = {
	/**
	 * UPSERT: A mágica do SQL nativo.
	 * Se o ID existir, ele atualiza. Se não, insere.
	 */
	upsert: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const form = await superValidate(request, zod4(serviceSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const { id, ...data } = form.data;

			// Criamos o objeto removendo undefineds e garantindo tipos corretos
			const payload: Record<string, any> = {
				name: data.name,
				duration: data.duration,
				profile_id: user.id,
				is_active: data.is_active ?? true,
				min_notice_hours: data.min_notice_hours ?? 2,
				buffer_after_min: data.buffer_after_min ?? 0
			};

			// Fail Fast: Só incluímos o ID se ele realmente existir (Update)
			// Se for string vazia ou undefined, deixamos o gen_random_uuid() agir
			if (id && id.trim() !== '') {
				payload.id = id;
			}

			const [row] = await sql`
                INSERT INTO services ${sql(payload)}
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    duration = EXCLUDED.duration,
                    is_active = EXCLUDED.is_active,
                    min_notice_hours = EXCLUDED.min_notice_hours,
                    buffer_after_min = EXCLUDED.buffer_after_min
                RETURNING id, name
            `;

			return message(form, { id: row.id, name: row.name });
		} catch (err) {
			console.error('Erro no upsert:', err);
			return message(form, 'Erro técnico ao salvar serviço.', { status: 500 });
		}
	},

	/**
	 * DELETE: Direto ao ponto
	 */
	delete: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return fail(400, { message: 'ID ausente' });

		try {
			await sql`
                DELETE FROM services 
                WHERE id = ${id} AND profile_id = ${user.id}
            `;
			return { success: true };
		} catch (err: any) {
			// Tratamento de Foreign Key (ex: serviço em uso em agendamentos)
			if (err.code === '23503') {
				return fail(400, { message: 'Serviço vinculado a agendamentos existentes.' });
			}
			return fail(500, { message: 'Erro ao excluir serviço.' });
		}
	},

	/**
	 * UPDATE STATUS: Toggle rápido
	 */
	updateStatus: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const is_active = formData.get('is_active') === 'true';

		if (!id) return fail(400);

		try {
			const result = await sql`
                UPDATE services 
                SET is_active = ${is_active}
                WHERE id = ${id} AND profile_id = ${user.id}
                RETURNING id
            `;

			if (result.count === 0) return fail(404, { message: 'Não encontrado.' });

			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro ao atualizar status.' });
		}
	}
};
