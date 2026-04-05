import type { PageServerLoad, Actions } from './$types';
import { today, getLocalTimeZone } from '@internationalized/date';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	const userId = locals.user?.id;
	const dateParam = url.searchParams.get('date') ?? today(getLocalTimeZone()).toString();

	const from = `${dateParam} 00:00:00`;
	const to = `${dateParam} 23:59:59`;

	// Buscamos os 3 conjuntos de dados em paralelo para não travar o carregamento
	const [appointmentsRes, customersRes, servicesRes, profileRes] = await Promise.all([
		locals.supabase.rpc('get_appointments', {
			p_profile_id: userId,
			p_from: from,
			p_to: to
		}),
		locals.supabase.from('customers').select('id, name').eq('profile_id', userId).order('name'),
		locals.supabase
			.from('services')
			.select('id, name, duration')
			.eq('profile_id', userId)
			.order('name'),
		locals.supabase.from('profiles').select('username').eq('id', userId).single()
	]);

	// Se a RPC falhar, ainda retornamos as listas vazias para o TS não reclamar
	if (appointmentsRes.error) {
		console.error('Erro na RPC:', appointmentsRes.error.message);
		return {
			appointments: [],
			customers: customersRes.data ?? [],
			services: servicesRes.data ?? [],
			username: profileRes.data?.username ?? 'user',
			selectedDate: dateParam,
			error: 'Falha ao carregar agendamentos.'
		};
	}

	return {
		appointments: appointmentsRes.data ?? [],
		customers: customersRes.data ?? [],
		services: servicesRes.data ?? [],
		username: profileRes.data?.username ?? 'user',
		selectedDate: dateParam
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const customer_id = formData.get('customer_id');
		const service_id = formData.get('service_id');
		const date = formData.get('date');
		const start_at = formData.get('start_at');
		const end_at = formData.get('end_at');

		// 1. Montamos o range no formato do Postgres: [inicio, fim)
		const slot = `[${date} ${start_at}:00, ${date} ${end_at}:00)`;

		// 2. Inserimos usando a coluna 'slot'
		const { error } = await locals.supabase.from('appointments').insert([
			{
				customer_id,
				service_id,
				slot, // Enviando o tstzrange aqui
				profile_id: locals.user?.id,
				status: 'pending'
			}
		]);

		if (error) {
			console.error(error);

			// 3. Captura o erro da constraint EXCLUDE (código 23P01 no Postgres)
			// Isso acontece quando o slot && outro_slot (sobreposição)
			if (error.code === '23P01') {
				return fail(400, {
					message: 'Horário indisponível: este horário coincide com outro agendamento.'
				});
			}

			return fail(500, { message: 'Erro ao salvar agendamento.' });
		}

		return { success: true };
	},

	toggleConfirmation: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		// 1. Primeiro, buscamos o status atual do agendamento
		const { data: appointment, error: fetchError } = await locals.supabase
			.from('appointments')
			.select('status')
			.eq('id', id)
			.single();

		if (fetchError || !appointment) {
			return fail(404, { message: 'Agendamento não encontrado.' });
		}

		// 2. Lógica de inversão (Toggle)
		// Se estiver confirmado, volta para pending. Caso contrário, vira confirmed.
		const newStatus = appointment.status === 'confirmed' ? 'pending' : 'confirmed';

		// 3. Update no banco com o novo status
		const { error: updateError } = await locals.supabase
			.from('appointments')
			.update({ status: newStatus })
			.eq('id', id);

		if (updateError) {
			return fail(500, { message: updateError.message });
		}

		return { success: true };
	},

	cancel: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase
			.from('appointments')
			.update({ status: 'cancelled' })
			.eq('id', id);

		if (error) return fail(500, { message: error.message });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase.from('appointments').delete().eq('id', id);

		if (error) {
			// Tratamento opcional do erro 23503 se você quiser aqui também
			return fail(500, { message: error.message });
		}

		return { success: true };
	}
};
