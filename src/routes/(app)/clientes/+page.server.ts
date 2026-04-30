import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema } from '$lib/schemas/app';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Dispara a validação e a query ao mesmo tempo
	const [form, { data: customers, error }] = await Promise.all([
		superValidate(zod4(customerSchema)),
		locals.supabase.from('customers').select('*').eq('profile_id', locals.user?.id).order('name')
	]);

	if (error) {
		return { form, customers: [], error: error.message };
	}

	return { form, customers: customers ?? [] };
};

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		// 1. Valida o formulário inteiro de uma vez
		const form = await superValidate(request, zod4(customerSchema));

		// 2. Se o Zod encontrar erros (nome curto, tel inválido, etc),
		// ele já retorna os erros formatados para o componente
		if (!form.valid) {
			return fail(400, { form });
		}

		// 3. Monta o objeto de dados usando form.data (que já está tipado!)
		const { id, name, phone } = form.data;
		const customerData = {
			name,
			phone,
			profile_id: locals.user?.id
		};

		// 4. Supabase
		const query = id
			? locals.supabase
					.from('customers')
					.update(customerData)
					.eq('id', id)
					.eq('profile_id', locals.user?.id)
					.select()
					.single()
			: locals.supabase.from('customers').insert([customerData]).select().single();

		const { data, error } = await query;

		if (error) {
			return message(form, `Erro no banco: ${error.message}`, { status: 500 });
		}

		// 2. Usamos o 'message' para devolver o ID e o Nome para o frontend
		// Isso é o que o seu CustomerForm.svelte vai ler no 'onUpdated'
		return message(form, { id: data.id, name: data.name });
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase
			.from('customers')
			.delete()
			.eq('id', id)
			.eq('profile_id', locals.user?.id);

		if (error?.code === '23503') {
			return fail(400, {
				message: 'Não é possível excluir: este cliente possui agendamentos vinculados'
			});
		} else if (error) {
			return fail(400, { message: 'Não foi possível excluir.' });
		}

		return { success: true };
	}
};
