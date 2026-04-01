import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	const { data: workingHours } = await supabase
		.from('working_hours')
		.select('*')
		.eq('profile_id', user?.id)
		.order('day_of_week');

	const { data: overrides } = await supabase
		.from('availability_overrides')
		.select('*')
		.eq('profile_id', user?.id)
		.gte('date', new Date().toISOString().split('T')[0])
		.order('date');

	return {
		workingHours: workingHours ?? [],
		overrides: overrides ?? []
	};
};

export const actions: Actions = {
	updateWorkingDay: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const is_active = formData.get('is_active') === 'on'; // Switch envia 'on' se marcado
		const start_time = formData.get('start_time');
		const end_time = formData.get('end_time');

		const { error } = await supabase
			.from('working_hours')
			.update({ is_active, start_time, end_time })
			.eq('id', id)
			.eq('profile_id', user?.id);

		if (error) return fail(400, { message: 'Verifique se o horário de término é após o início.' });
		return { success: true };
	},

	upsertOverride: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const date = formData.get('date');
		const is_available = formData.get('is_available') === 'on';
		const start_time = formData.get('start_time') || null;
		const end_time = formData.get('end_time') || null;
		const note = formData.get('note');

		const { error } = await supabase.from('availability_overrides').upsert({
			profile_id: user?.id,
			date,
			is_available,
			start_time: is_available ? start_time : null,
			end_time: is_available ? end_time : null,
			note
		});

		if (error) return fail(400, { message: error.message });
		return { success: true };
	},

	deleteOverride: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await supabase
			.from('availability_overrides')
			.delete()
			.eq('id', id)
			.eq('profile_id', user?.id);

		if (error) return fail(500, { message: 'Erro ao remover exceção.' });
		return { success: true };
	}
};
