import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

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
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const current_stock = formData.get('current_stock') as string;
		const min_stock_level = formData.get('min_stock_level') as string;
		const unit = formData.get('unit') as string;

		if (!name || !current_stock) return fail(400, { message: 'Campos obrigatórios' });

		if (id) {
			await sql`
				UPDATE inventory 
				SET name = ${name}, 
				    current_stock = ${current_stock}, 
				    min_stock_level = ${min_stock_level}, 
				    unit = ${unit},
				    last_updated = now()
				WHERE id = ${id} AND profile_id = ${user.id}
			`;
		} else {
			await sql`
				INSERT INTO inventory (profile_id, name, current_stock, min_stock_level, unit)
				VALUES (${user.id}, ${name}, ${current_stock}, ${min_stock_level}, ${unit})
			`;
		}

		return { success: true };
	},

	delete: async ({ request, locals: { sql, user } }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { message: 'ID ausente' });

		await sql`
			DELETE FROM inventory 
			WHERE id = ${id} AND profile_id = ${user.id}
		`;

		return { success: true };
	}
};
