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

			const payload: Record<string, any> = {
				name: data.name,
				duration: data.duration,
				profile_id: user.id,
				is_active: data.is_active ?? true,
				min_notice_hours: data.min_notice_hours ?? 2,
				buffer_after_min: data.buffer_after_min ?? 0
			};

			if (id && id.trim() !== '') {
				payload.id = id;
			}

			// ⚡ Usamos uma transação para amarrar o salvamento ao refresh da esteira
			const row = await sql.begin(async (sql) => {
				const [insertedRow] = await sql`
                    INSERT INTO services ${sql(payload)}
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        duration = EXCLUDED.duration,
                        is_active = EXCLUDED.is_active,
                        min_notice_hours = EXCLUDED.min_notice_hours,
                        buffer_after_min = EXCLUDED.buffer_after_min
                    RETURNING id, name
                `;

				// 🔄 Dispara o recálculo da esteira de slots para os próximos 90 dias
				// A nossa procedure já limpa internamente os slots livres futuros antes de recriar
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;

				return insertedRow;
			});

			return {
				success: true,
				service: { id: row.id, name: row.name }
			};
		} catch (err) {
			console.error('Erro no upsert:', err);
			return message(form, 'Erro técnico ao salvar serviço e atualizar agenda.', { status: 500 });
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
			// ⚡ Transação para amarrar o delete ao recálculo da agenda
			await sql.begin(async (sql) => {
				await sql`
                    DELETE FROM services 
                    WHERE id = ${id} AND profile_id = ${user.id}
                `;

				// 🔄 Como o serviço sumiu, forçamos a esteira a se reorganizar
				// para os serviços que restaram ativos nos próximos 90 dias
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
			});

			return { success: true };
		} catch (err: any) {
			// Tratamento de Foreign Key (ex: serviço já possui agendamentos marcados)
			if (err.code === '23503') {
				return fail(400, {
					message: 'Este serviço possui agendamentos vinculados e não pode ser excluído.'
				});
			}
			return fail(500, { message: 'Erro interno ao excluir serviço' });
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
			// ⚡ Transação para garantir consistência entre o status e a grade de horários
			await sql.begin(async (sql) => {
				const result = await sql`
                    UPDATE services 
                    SET is_active = ${is_active}
                    WHERE id = ${id} AND profile_id = ${user.id}
                    RETURNING id
                `;

				if (result.count === 0) {
					// Lança um erro para forçar o rollback da transação caso o ID não exista/não seja do usuário
					throw new Error('NOT_FOUND');
				}

				// 🔄 Sincroniza a esteira de agendamentos com o novo estado do serviço
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
			});

			return { success: true };
		} catch (err: any) {
			if (err.message === 'NOT_FOUND') {
				return fail(404, { message: 'Serviço não encontrado.' });
			}
			console.error('Erro no updateStatus:', err);
			return fail(500, { message: 'Erro interno ao atualizar status e sincronizar agenda.' });
		}
	}
};
