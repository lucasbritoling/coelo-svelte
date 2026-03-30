import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: services, error } = await locals.supabase
		.from('services')
		.select('*')
		.order('name');

	if (error) return { services: [], error: error.message };
	return { services };
};

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const duration = parseInt(formData.get('duration') as string);

		if (isNaN(duration) || duration <= 0) {
			return fail(400, { message: 'Duração inválida' });
		}

		const serviceData = {
			name,
			duration,
			profile_id: locals.user?.id
		};

		let result;
		if (id) {
			result = await locals.supabase.from('services').update(serviceData).eq('id', id);
		} else {
			result = await locals.supabase.from('services').insert([serviceData]);
		}

		if (result.error) return fail(500, { message: result.error.message });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase.from('services').delete().eq('id', id);

		if (error) {
			// Código 23503: Violação de chave estrangeira (foreign_key_violation)
			// Acontece quando o serviço está sendo usado em outra tabela (ex: appointments)
			if (error.code === '23503') {
				return fail(400, {
					message: 'Não é possível excluir: este serviço possui agendamentos vinculados.'
				});
			}

			// Para outros erros (conexão, permissão, etc)
			return fail(500, { message: 'Erro interno ao tentar excluir o serviço.' });
		}

		return { success: true };
	}
};
