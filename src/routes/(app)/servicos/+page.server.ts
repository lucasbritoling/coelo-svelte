import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { serviceSchema } from '$lib/schemas/app';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	const [servicesResponse, form] = await Promise.all([
		supabase.from('services').select('*').eq('profile_id', user?.id).order('name'),

		superValidate(zod4(serviceSchema))
	]);

	const { data: services, error: dbError } = servicesResponse;

	if (dbError) {
		throw error(500, 'Erro ao carregar serviços: ' + dbError.message);
	}

	return {
		services: services ?? [],
		form
	};
};

export const actions: Actions = {
	/**
	 * UPSERT: Cria ou Atualiza um serviço
	 */
	upsert: async ({ request, locals: { supabase, user } }) => {
		const form = await superValidate(request, zod4(serviceSchema));

		// Validação do Zod (lado do servidor)
		if (!form.valid) {
			return fail(400, { form });
		}

		const { id, ...data } = form.data;

		// Dados formatados para o Supabase
		const serviceData = {
			...data,
			profile_id: user?.id
		};

		let result;

		if (id && id !== '') {
			// Caso tenha ID, atualiza o registro existente
			result = await supabase
				.from('services')
				.update(serviceData)
				.eq('id', id)
				.eq('profile_id', user?.id) // Garantia extra de posse
				.select()
				.single();
		} else {
			// Caso não tenha ID, insere um novo
			result = await supabase.from('services').insert([serviceData]).select().single();
		}

		if (result.error) {
			return message(form, 'Erro ao salvar no banco de dados.', { status: 500 });
		}

		return message(form, { id: result.data.id, name: result.data.name });
	},

	/**
	 * DELETE: Remove um serviço
	 */
	delete: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { message: 'ID do serviço não fornecido.' });
		}

		const { error: dbError } = await supabase
			.from('services')
			.delete()
			.eq('id', id)
			.eq('profile_id', user?.id); // Segurança: Só deleta se for o dono

		if (dbError) {
			// Código 23503: foreign_key_violation (Serviço vinculado a agendamentos)
			if (dbError.code === '23503') {
				return fail(400, {
					message: 'Não é possível excluir: este serviço possui agendamentos vinculados.'
				});
			}

			return fail(500, { message: 'Erro ao tentar excluir o serviço.' });
		}

		return { success: true };
	},

	updateStatus: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const is_active = formData.get('is_active') === 'true';

		const { data, error } = await supabase
			.from('services')
			.update({ is_active })
			.eq('id', id)
			.eq('profile_id', user?.id)
			.select('id'); // Pedimos apenas o ID para confirmar que houve sucesso

		if (error) {
			return fail(500, { message: 'Erro ao atualizar status.' });
		}

		// Se o array vier vazio, significa que o ID não existia ou não pertencia ao usuário
		if (!data || data.length === 0) {
			return fail(404, { message: 'Serviço não encontrado.' });
		}

		return { success: true };
	}
};
