import type { PageServerLoad, Actions } from './$types';
import { today, getLocalTimeZone } from '@internationalized/date';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	const userId = locals.user?.id;
	const dateParam = url.searchParams.get('date') ?? today(getLocalTimeZone()).toString();

	const from = `${dateParam}T00:00:00-03:00`;
	const to = `${dateParam}T23:59:59-03:00`;

	// Buscamos os 3 conjuntos de dados em paralelo para não travar o carregamento
	const [appointmentsRes, customersRes, servicesRes, profileRes] = await Promise.all([
		locals.supabase.rpc('get_appointments', {
			p_profile_id: locals.user?.id,
			p_from_tz: from,
			p_to_tz: to
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
		// O sufixo -03:00 (ou o seu fuso local) é importante para o timestamptz
		const slot = `[${date}T${start_at}:00-03:00, ${date}T${end_at}:00-03:00)`;

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
					message: 'Horário indisponível: este slot coincide com outro agendamento.'
				});
			}

			return fail(500, { message: 'Erro ao salvar agendamento.' });
		}

		return { success: true };
	},

	confirm: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await locals.supabase
			.from('appointments')
			.update({ status: 'confirmed' })
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
