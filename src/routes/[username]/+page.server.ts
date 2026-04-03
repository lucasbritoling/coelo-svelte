import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { CalendarDateTime } from '@internationalized/date';

export const load: PageServerLoad = async ({ params, url, locals: { supabase } }) => {
	const { username } = params;
	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');

	// 1. Busca perfil e serviços
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select(`id, full_name, username, avatar_url, services (id, name, duration, price)`)
		.eq('username', username)
		.single();

	if (profileError || !profile) throw error(404, 'Profissional não encontrado');

	let availableSlots = [];

	// --- LOG DE ENTRADA ---
	console.log('--- DEBUG AGENDAMENTO ---');
	console.log('Parâmetros da URL:', { date, serviceId });

	if (date && serviceId) {
		// 2. TENTATIVA DE ENCONTRAR O SERVIÇO
		// Usamos == (dois iguais) caso o ID no banco seja número e na URL string
		const selectedService = profile.services.find((s) => s.id == serviceId);

		console.log('Serviço selecionado encontrado?', !!selectedService);

		if (selectedService) {
			console.log('Chamando RPC get_available_slots com:', {
				p_profile_id: profile.id,
				p_date: date,
				p_service_duration_min: selectedService.duration
			});

			const { data: slots, error: rpcError } = await supabase.rpc('get_available_slots', {
				p_profile_id: profile.id,
				p_date: date,
				p_service_duration_min: selectedService.duration
			});

			console.log(slots);

			if (rpcError) {
				console.error('❌ ERRO NA RPC:', rpcError.message);
			} else {
				availableSlots = slots ?? [];
				console.log('✅ Slots encontrados:', availableSlots.length);
			}
		} else {
			console.warn('⚠️ ID do serviço não coincide com nenhum serviço do perfil.');
		}
	}

	return {
		professional: profile,
		services: profile.services,
		slots: availableSlots,
		selectedDate: date,
		selectedServiceId: serviceId
	};
};

export const actions: Actions = {
	finishSelfBooking: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		// Dados do agendamento
		const profile_id = formData.get('profile_id') as string;
		const service_id = formData.get('service_id') as string;
		const selected_date = formData.get('selected_date') as string; // Ex: "2026-04-03"
		const slot_start_time = formData.get('slot_start') as string; // Ex: "14:30"

		// Dados do cliente
		const customer_name = formData.get('customer_name') as string;
		const customer_phone = formData.get('customer_phone') as string;

		// Validação básica de entrada
		if (!customer_name || !customer_phone || !selected_date || !slot_start_time) {
			return fail(400, { message: 'Preencha todos os campos obrigatórios.' });
		}

		// 1. Garantir que o cliente existe (Upsert baseado na constraint composta)
		// Nota: Conforme seu DDL, a coluna é 'name' e não 'full_name'
		const { data: customer, error: customerError } = await supabase
			.from('customers')
			.upsert(
				{
					profile_id,
					name: customer_name,
					phone: customer_phone
				},
				{ onConflict: 'profile_id, phone' }
			)
			.select('id')
			.single();

		if (customerError || !customer) {
			console.error('Erro no upsert do cliente:', customerError);
			return fail(500, { message: 'Erro ao processar dados do cliente.' });
		}

		// 2. Buscar duração do serviço para calcular o fim do slot
		const { data: service, error: serviceError } = await supabase
			.from('services')
			.select('duration')
			.eq('id', service_id)
			.single();

		if (serviceError || !service) {
			return fail(400, { message: 'Serviço não encontrado.' });
		}

		// 3. Montar o TSRANGE usando @internationalized/date
		let slotString: string;
		try {
			// Desmembrar strings para números (YYYY-MM-DD e HH:mm)
			const [year, month, day] = selected_date.split('-').map(Number);
			const [hour, minute] = slot_start_time.split(':').map(Number);

			// Criar objeto de data e hora sem fuso horário (CalendarDateTime)
			const start = new CalendarDateTime(year, month, day, hour, minute);
			const end = start.add({ minutes: service.duration });

			// Formatar para o padrão tsrange do Postgres: [YYYY-MM-DD HH:mm:ss, YYYY-MM-DD HH:mm:ss)
			// .toString() retorna "YYYY-MM-DDTHH:mm:ss", trocamos o T por espaço
			const startFmt = start.toString().replace('T', ' ');
			const endFmt = end.toString().replace('T', ' ');

			slotString = `[${startFmt}, ${endFmt})`;
		} catch (e) {
			console.error('Erro ao processar data/hora:', e);
			return fail(400, { message: 'Horário selecionado inválido.' });
		}

		// 4. Inserir o agendamento na tabela public.appointments
		const { error: appointmentError } = await supabase.from('appointments').insert({
			profile_id,
			customer_id: customer.id,
			service_id,
			slot: slotString,
			status: 'pending'
		});

		if (appointmentError) {
			// Erro 23P01: Violation of Exclusion Constraint (Sobreposição de horário)
			if (appointmentError.code === '23P01') {
				return fail(400, {
					message: 'Este horário acabou de ser ocupado. Por favor, escolha outro.'
				});
			}

			console.error('Erro ao salvar agendamento:', appointmentError);
			return fail(500, { message: 'Erro interno ao salvar o agendamento.' });
		}

		return { success: true };
	}
};
