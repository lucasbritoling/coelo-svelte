import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	// Filtramos tanto serviços quanto transações pelo profile_id (user.id)
	const [services, transactions] = await Promise.all([
		sql`
            SELECT id, name, price 
            FROM services 
            WHERE profile_id = ${user.id} 
            AND is_active = true 
            ORDER BY name
        `,
		sql`
            SELECT id, description, amount, type, transaction_date 
            FROM transactions 
            WHERE profile_id = ${user.id} 
            ORDER BY transaction_date DESC 
            LIMIT 20
        `
	]);

	return { services, transactions };
};

export const actions: Actions = {
	upsert: async ({ request, locals: { sql, user } }) => {
		const formData = await request.formData();
		const type = formData.get('type') as string;
		const amount = formData.get('valor') as string;
		const desc = formData.get('desc') as string;
		// serviceId pode ser null se for uma despesa simples
		const serviceId = (formData.get('serviceId') as string) || null;

		if (!amount || Number(amount) <= 0) return fail(400, { message: 'Valor inválido' });

		// Inserção incluindo o profile_id para garantir a segurança da RLS
		await sql`
            INSERT INTO transactions (profile_id, type, amount, description)
            VALUES (${user.id}, ${type}, ${amount}, ${desc})
        `;

		return { success: true };
	}
};
