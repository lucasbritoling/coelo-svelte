import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { sql, user } }) => {
	if (!user) throw error(401, 'Não autorizado');

	const searchQuery = url.searchParams.get('q')?.trim() ?? '';

	try {
		// Executa a busca otimizada isolada que removemos do load principal
		const customers = await sql`
			SELECT id, name 
			FROM public.customers 
			WHERE profile_id = ${user.id}::uuid
			  AND (${searchQuery} = '' OR lower(name) LIKE ${'%' + searchQuery.toLowerCase() + '%'})
			ORDER BY name 
			LIMIT 50
		`;

		return json(customers);
	} catch (err) {
		console.error('[API Customers Error]:', err);
		throw error(500, 'Erro ao buscar clientes');
	}
};
