import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	// 1. Busca Working Hours
	const { data: workingHours, error: whError } = await supabase
		.from('working_hours')
		.select('*')
		.eq('profile_id', user?.id)
		.order('day_of_week');

	if (whError) console.error('Erro ao buscar Working Hours:', whError);

	// 2. Busca Exceções (Overrides)
	const { data: overrides } = await supabase
		.from('availability_overrides')
		.select('*')
		.eq('profile_id', user?.id)
		.gte('date', new Date().toISOString().split('T')[0])
		.order('date');

	console.log('LOAD - Working Hours enviadas para UI:', workingHours?.length);

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
		const formData = await request.formData();
		const id = formData.get('id');
		const is_active = formData.has('is_active'); // Verifica presença da chave
		const start_time = formData.get('start_time')?.toString();
		const end_time = formData.get('end_time')?.toString();

		// --- DEBUG SERVER ---
		console.log('--- ACTION: updateWorkingDay ---');
		console.log('Form Data Bruto:', { id, is_active, start_time, end_time });

		const updateData: any = { is_active };
		if (start_time && start_time !== '') updateData.start_time = start_time;
		if (end_time && end_time !== '') updateData.end_time = end_time;

		console.log('Objeto enviado para o Supabase:', updateData);

		const { data, error, status } = await supabase
			.from('working_hours')
			.update(updateData)
			.eq('id', id)
			.eq('profile_id', user?.id)
			.select(); // Forçamos o select para ver o que mudou

		if (error) {
			console.error('ERRO SUPABASE:', error.message);
			return fail(400, { message: error.message });
		}

		console.log('SUCESSO NO BANCO. Novo estado:', data?.[0]);
		console.log('Status HTTP:', status);

		return { success: true };
	},

	upsertOverride: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();

		// Coleta de dados para o log
		const date = formData.get('date');
		const is_available = formData.has('is_available');
		const start_time = formData.get('start_time')?.toString() || null;
		const end_time = formData.get('end_time')?.toString() || null;
		const note = formData.get('note')?.toString() || null;

		console.log('--- DEBUG: upsertOverride ---');
		console.log('Recebido do Form:', { date, is_available, start_time, end_time, note });

		const payload = {
			profile_id: user?.id,
			date,
			is_available,
			start_time: is_available ? start_time : null,
			end_time: is_available ? end_time : null,
			note: note || null
		};

		console.log('Payload para o Supabase:', payload);

		const { data, error } = await supabase.from('availability_overrides').upsert(payload).select();

		if (error) {
			console.error('ERRO SUPABASE OVERRIDE:', error.message, error.details);
			return fail(400, { message: error.message });
		}

		console.log('SUCESSO OVERRIDE:', data?.[0]);
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
