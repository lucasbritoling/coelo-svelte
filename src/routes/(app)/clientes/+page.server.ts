import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema } from '$lib/schemas/app';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { sql, user }, url }) => {
	if (!user) throw redirect(303, '/login');

	const q = url.searchParams.get('q') || '';

	const customers = await sql`
        SELECT id, name, phone 
        FROM customers 
        WHERE profile_id = ${user.id} 
        ${q ? sql`AND (name ILIKE ${'%' + q + '%'} OR phone ILIKE ${'%' + q + '%'})` : sql``}
        ORDER BY name ASC
        LIMIT 100
    `;

	return { customers, q };
};

export const actions: Actions = {
	upsert: async ({ request, locals: { sql, user } }) => {
		if (!user?.id) return fail(401);

		const form = await superValidate(request, zod4(customerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const normalizedName = form.data.name
			.replace(/[~^´`]/g, '')
			.trim()
			.toLowerCase();
		const { id, phone } = form.data;

		try {
			let result;

			if (id) {
				// UPDATE com proteção de dono (profile_id)
				[result] = await sql`
                    UPDATE customers 
                    SET name = ${normalizedName}, phone = ${phone}
                    WHERE id = ${id} AND profile_id = ${user.id}
                    RETURNING id, name
                `;
			} else {
				// INSERT
				[result] = await sql`
                    INSERT INTO customers (name, phone, profile_id)
                    VALUES (${normalizedName}, ${phone}, ${user.id})
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
					message: 'Cliente possui agendamentos'
				});
			}

			console.error('Erro ao deletar:', error);
			return fail(500, { message: 'Erro interno ao tentar excluir o cliente.' });
		}
	}
};
