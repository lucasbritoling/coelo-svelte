import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) throw redirect(303, '/login');
	// 1. Load paralelo: workinghours & overrides
	const [workingHoursResponse, overridesResponse] = await Promise.all([
		supabase.from('working_hours').select('*').eq('profile_id', user?.id).order('day_of_week'),

		supabase
			.from('availability_overrides')
			.select('*')
			.eq('profile_id', user?.id)
			.gte('date', new Date().toISOString().split('T')[0])
			.order('date')
	]);

	const { data: workingHours } = workingHoursResponse;
	const { data: overrides } = overridesResponse;

	//console.log('LOAD - Working Hours enviadas para UI:', workingHours?.length);

	return {
		// TRATAMENTO CRUCIAL: O input type="time" buga com segundos (HH:mm:ss).
		// Formatamos para HH:mm e garantimos valores padrão caso o banco esteja nulo.
		workingHours:
			workingHours?.map((day) => ({
				...day,
				start_time: day.start_time ? day.start_time.slice(0, 5) : '09:00',
				end_time: day.end_time ? day.end_time.slice(0, 5) : '18:00'
			})) ?? [],
		overrides: overrides ?? []
	};
};

export const actions: Actions = {
	updateWorkingDay: async ({ request, locals: { supabase, user } }) => {
		if (!user?.id) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id');

		// Como a tabela é NOT NULL, precisamos de valores padrão caso venham vazios
		// ou validar para impedir o envio de nulos.
		const start_time = formData.get('start_time')?.toString() || '09:00';
		const end_time = formData.get('end_time')?.toString() || '18:00';

		const { error } = await supabase
			.from('working_hours')
			.update({
				is_active: formData.has('is_active'),
				start_time,
				end_time
			})
			.eq('id', id)
			.eq('profile_id', user.id); // Segurança: impede editar horário de outro perfil

		if (error) {
			// Erro 23514 é o código do Postgres para violação de CHECK constraint (end_time > start_time)
			if (error.code === '23514') {
				return fail(400, { message: 'O horário de término deve ser maior que o de início.' });
			}
			return fail(400, { message: error.message });
		}

		return { success: true };
	},
	upsertOverride: async ({ request, locals: { supabase, user } }) => {
		if (!user?.id) return fail(401);

		const formData = await request.formData();
		const is_available = formData.has('is_available');

		const payload = {
			profile_id: user.id, // Forçamos o ID do usuário logado
			date: formData.get('date'),
			is_available,
			start_time: is_available ? formData.get('start_time') : null,
			end_time: is_available ? formData.get('end_time') : null,
			note: formData.get('note')?.toString() || null
		};

		const { error } = await supabase.from('availability_overrides').upsert(payload, {
			// O PostgREST usa o nome da constraint ou as colunas para resolver o conflito
			onConflict: 'profile_id, date'
		});

		if (error) {
			// Se o erro for da constraint 'valid_override_range', você pode tratar aqui
			if (error.code === '23514') {
				return fail(400, { message: 'O horário de término deve ser após o início.' });
			}
			return fail(400, { message: error.message });
		}

		return { success: true };
	},
	deleteOverride: async ({ request, locals: { supabase, user } }) => {
		if (!user?.id) return fail(401);
		const formData = await request.formData();

		const { error } = await supabase
			.from('availability_overrides')
			.delete()
			.eq('id', formData.get('id'))
			.eq('profile_id', user.id);

		if (error) return fail(500, { message: 'Erro ao remover exceção.' });
		return { success: true };
	}
};
