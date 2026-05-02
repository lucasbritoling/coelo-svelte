import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema } from '$lib/schemas/app';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	// O Promise.all continua sendo útil para performance
	const [form, customers] = await Promise.all([
		superValidate(zod4(customerSchema)),
		sql`
            SELECT id, name, phone 
            FROM customers 
            WHERE profile_id = ${user.id} 
            ORDER BY name ASC
        `
	]);

	return { form, customers };
};

export const actions: Actions = {
	upsert: async ({ request, locals: { sql, user } }) => {
		if (!user?.id) return fail(401);

		const form = await superValidate(request, zod4(customerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { id, name, phone } = form.data;

		try {
			let result;

			if (id) {
				// UPDATE com proteção de dono (profile_id)
				[result] = await sql`
                    UPDATE customers 
                    SET name = ${name}, phone = ${phone}
                    WHERE id = ${id} AND profile_id = ${user.id}
                    RETURNING id, name
                `;
			} else {
				// INSERT
				[result] = await sql`
                    INSERT INTO customers (name, phone, profile_id)
                    VALUES (${name}, ${phone}, ${user.id})
                    RETURNING id, name
                `;
			}

			if (!result) {
				return message(form, 'Cliente não encontrado ou sem permissão.', { status: 404 });
			}

			return message(form, { id: result.id, name: result.name });
		} catch (error: any) {
			console.error('Erro no Postgres:', error);
			return message(form, `Erro no banco: ${error.message}`, { status: 500 });
		}
	},

	delete: async ({ request, locals: { sql, user } }) => {
		if (!user?.id) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { message: 'ID não fornecido.' });

		try {
			const result = await sql`
                DELETE FROM customers 
                WHERE id = ${id} AND profile_id = ${user.id}
                RETURNING id
            `;

			if (result.count === 0) {
				return fail(404, { message: 'Cliente não encontrado.' });
			}

			return { success: true };
		} catch (error: any) {
			// Código 23503 é Foreign Key Violation no Postgres
			if (error.code === '23503') {
				return fail(400, {
					message: 'Não é possível excluir: este cliente possui agendamentos vinculados'
				});
			}

			console.error('Erro ao deletar:', error);
			return fail(500, { message: 'Não foi possível excluir o cliente.' });
		}
	}
};
