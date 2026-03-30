import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: customers, error } = await locals.supabase
		.from('customers')
		.select('*')
		.order('name');

	if (error) return { customers: [], error: error.message };
	return { customers };
};

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const phone = formData.get('phone') as string;

		const customerData = {
			name,
			phone,
			profile_id: locals.user?.id
		};

		let result;
		if (id) {
			result = await locals.supabase.from('customers').update(customerData).eq('id', id);
		} else {
			result = await locals.supabase.from('customers').insert([customerData]);
		}

		if (result.error) return fail(500, { message: result.error.message });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase.from('customers').delete().eq('id', id);

		if (error) {
			// Código 23503: foreign_key_violation (Violação de chave estrangeira)
			// Ocorre quando o cliente está vinculado a um agendamento existente
			if (error.code === '23503') {
				return fail(400, {
					message: 'Cliente possui agendamentos.'
				});
			}

			// Erro genérico para outros problemas (permissão RLS, rede, etc)
			return fail(500, { message: 'Erro ao tentar excluir o cliente.' });
		}

		return { success: true };
	}
};
