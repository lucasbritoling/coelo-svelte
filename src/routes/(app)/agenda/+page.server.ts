import type { PageServerLoad, Actions } from './$types';
import { today, getLocalTimeZone } from '@internationalized/date';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema, serviceSchema } from '$lib/schemas/app'; // Certifique-se que o caminho está correto

export const load: PageServerLoad = async ({ url, locals: { supabase, user } }) => {
	if (!user) throw redirect(303, '/login');

	const userId = user?.id;

	const dateParam = url.searchParams.get('date') ?? today(getLocalTimeZone()).toString();
	const from = `${dateParam} 00:00:00`;
	const to = `${dateParam} 23:59:59`;

	// 2. Instanciação do superValidate e Busca de dados em paralelo
	const [customerForm, serviceForm, appointmentsRes, customersRes, servicesRes, profileRes] =
		await Promise.all([
			superValidate(zod4(customerSchema)),
			superValidate(zod4(serviceSchema)),
			supabase.rpc('get_appointments', {
				p_profile_id: userId,
				p_from: from,
				p_to: to
			}),
			supabase.from('customers').select('id, name').eq('profile_id', userId).order('name'),
			supabase
				.from('services')
				.select('id, name, duration')
				.eq('profile_id', userId)
				.eq('is_active', true)
				.order('name'),
			supabase.from('profiles').select('username').eq('id', userId).single()
		]);

	const commonData = {
		customers: customersRes.data ?? [],
		services: servicesRes.data ?? [],
		username: profileRes.data?.username ?? 'user',
		selectedDate: dateParam,
		customerForm,
		serviceForm
	};

	// 4. Tratamento de erro da RPC
	if (appointmentsRes.error) {
		return {
			...commonData,
			appointments: [],
			error: 'Falha ao carregar agendamentos.'
		};
	}

	return {
		...commonData,
		appointments: appointmentsRes.data ?? []
	};
};

export const actions: Actions = {
	create: async ({ request, locals: { supabase, user } }) => {
		if (!user?.id) return fail(401);

		const formData = await request.formData();
		const customer_id = formData.get('customer_id');
		const service_id = formData.get('service_id');
		const date = formData.get('date');
		const start_at = formData.get('start_at');
		const end_at = formData.get('end_at');

		// 1. Montamos o range no formato do Postgres: [inicio, fim)
		const slot = `[${date} ${start_at}:00, ${date} ${end_at}:00)`;

		// 2. Inserimos usando a coluna 'slot'
		const { error } = await supabase.from('appointments').insert([
			{
				customer_id,
				service_id,
				slot, // Enviando o tstzrange aqui
				profile_id: user?.id,
				status: 'pending'
			}
		]);

		if (error) {
			//console.error(error);

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

	toggleConfirmation: async ({ request, locals: { supabase, user } }) => {
		if (!user?.id) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id');

		// 1. Primeiro, buscamos o status atual do agendamento
		const { data: appointment, error: fetchError } = await supabase
			.from('appointments')
			.select('status')
			.eq('id', id)
			.eq('profile_id', user.id)
			.single();

		if (fetchError || !appointment) {
			return fail(404, { message: 'Agendamento não encontrado.' });
		}

		// 2. Lógica de inversão (Toggle)
		// Se estiver confirmado, volta para pending. Caso contrário, vira confirmed.
		const newStatus = appointment.status === 'confirmed' ? 'pending' : 'confirmed';

		// 3. Update no banco com o novo status
		const { error: updateError } = await supabase
			.from('appointments')
			.update({ status: newStatus })
			.eq('id', id)
			.eq('profile_id', user.id);

		if (updateError) {
			return fail(500, { message: updateError.message });
		}

		return { success: true };
	},

	cancel: async ({ request, locals: { supabase, user } }) => {
		if (!user?.id) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await supabase
			.from('appointments')
			.update({ status: 'cancelled' })
			.eq('id', id)
			.eq('profile_id', user.id);

		if (error) return fail(500, { message: error.message });
		return { success: true };
	},

	delete: async ({ request, locals: { supabase, user } }) => {
		if (!user?.id) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id');

		const { error } = await supabase
			.from('appointments')
			.delete()
			.eq('id', id)
			.eq('profile_id', user.id);

		if (error) {
			// Tratamento opcional do erro 23503 se você quiser aqui também
			return fail(500, { message: error.message });
		}

		return { success: true };
	}
};
