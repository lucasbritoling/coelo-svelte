import type { PageServerLoad } from './$types';
import { today, getLocalTimeZone } from '@internationalized/date';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	// 1. Pega a data da URL ou define 'hoje'
	const dateParam = url.searchParams.get('date') ?? today(getLocalTimeZone()).toString();

	// 2. Prepara o range (00:00 até 23:59)
	const from = `${dateParam}T00:00:00-03:00`;
	const to = `${dateParam}T23:59:59-03:00`;

	// 3. Usa o supabase que está no locals
	// O locals.supabase já deve estar autenticado pelo hook
	const { data: appointments, error } = await locals.supabase.rpc('get_appointments', {
		p_profile_id: locals.user?.id,
		p_from_tz: from,
		p_to_tz: to
	});

	console.log(appointments);

	if (error) {
		console.error('Erro na RPC:', error.message);
		return { appointments: [], selectedDate: dateParam, error: 'Falha ao carregar agendamentos.' };
	}

	return {
		appointments: appointments ?? [],
		selectedDate: dateParam
	};
};

export const actions = {
	confirm: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase
			.from('appointments')
			.update({ status: 'confirmed' }) // Altera o status
			.eq('id', id);

		if (error) return fail(500, { message: error.message });
		return { success: true };
	},
	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase.from('appointments').delete().eq('id', id);

		if (error) {
			return fail(500, { message: error.message });
		}

		return { success: true };
	}
};
