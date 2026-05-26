import type { PageServerLoad, Actions } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { inventorySchema } from '$lib/schemas/inventory';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	const inventory = await sql`
		SELECT id, name, current_stock, min_stock_level, unit
		FROM inventory
		WHERE profile_id = ${user.id}
		ORDER BY name ASC
	`;

	return { inventory };
};

export const actions: Actions = {
	upsert: async ({ request, locals: { sql, user } }) => {
		if (!user?.id) return fail(401);

		const form = await superValidate(request, zod4(inventorySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { id, name, current_stock, min_stock_level, unit } = form.data;

		try {
			let result;

			if (id) {
				// UPDATE
				[result] = await sql`
                    UPDATE inventory 
                    SET name = ${name}, 
                        current_stock = ${current_stock}, 
                        min_stock_level = ${min_stock_level}, 
                        unit = ${unit},
                        last_updated = now()
                    WHERE id = ${id} AND profile_id = ${user.id}
                    RETURNING id, name
                `;
			} else {
				// INSERT
				[result] = await sql`
                    INSERT INTO inventory (profile_id, name, current_stock, min_stock_level, unit)
                    VALUES (${user.id}, ${name}, ${current_stock}, ${min_stock_level}, ${unit})
                    RETURNING id, name
                `;
			}

			if (!result) {
				return message(form, 'Item não encontrado ou sem permissão.', { status: 404 });
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
                DELETE FROM inventory 
                WHERE id = ${id} AND profile_id = ${user.id}
                RETURNING id
            `;

			if (result.count === 0) {
				return fail(404, { message: 'Item não encontrado.' });
			}

			return { success: true };
		} catch (error: any) {
			// Código 23503 é Foreign Key Violation no Postgres
			if (error.code === '23503') {
				return fail(400, {
					message: 'Este item não pode ser excluído pois possui movimentações vinculadas.'
				});
			}

			console.error('Erro ao deletar:', error);
			return fail(500, { message: 'Erro interno ao tentar excluir o item.' });
		}
	}
};
