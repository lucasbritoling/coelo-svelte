import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { sql, user } }) => {
	if (!user) throw error(401, 'Não autorizado');

	const searchQuery = url.searchParams.get('q')?.trim() ?? '';

	// Remove tudo o que não for número para buscar no campo de telefone limpo do banco
	const cleanPhoneQuery = searchQuery.replace(/\D/g, '');

	try {
		// Executa a busca otimizada por Nome ou Telefone
		const customers = await sql`
			SELECT id, name, phone 
			FROM public.customers 
			WHERE profile_id = ${user.id}::uuid
			  AND (
				${searchQuery} = '' 
				OR lower(name) LIKE ${'%' + searchQuery.toLowerCase() + '%'}
				OR (${cleanPhoneQuery} != '' AND phone LIKE ${'%' + cleanPhoneQuery + '%'})
			  )
			ORDER BY name 
			LIMIT 50
		`;

		return json(customers);
	} catch (err) {
		console.error('[API Customers Error]:', err);
		throw error(500, 'Erro ao buscar clientes');
	}
};
