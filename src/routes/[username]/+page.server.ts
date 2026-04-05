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
	//console.log('--- DEBUG AGENDAMENTO ---');
	//console.log('Parâmetros da URL:', { date, serviceId });

	if (date && serviceId) {
		// 2. TENTATIVA DE ENCONTRAR O SERVIÇO
		// Usamos == (dois iguais) caso o ID no banco seja número e na URL string
		const selectedService = profile.services.find((s) => s.id == serviceId);

		//console.log('Serviço selecionado encontrado?', !!selectedService);

		if (selectedService) {
			/*console.log('Chamando RPC get_available_slots com:', {
				p_profile_id: profile.id,
				p_date: date,
				p_service_duration_min: selectedService.duration
			}); */

			const { data: slots, error: rpcError } = await supabase.rpc('get_available_slots', {
				p_profile_id: profile.id,
				p_date: date,
				p_service_duration_min: selectedService.duration
			});

			//console.log(slots);

			if (rpcError) {
				console.error('❌ ERRO NA RPC:', rpcError.message);
			} else {
				availableSlots = slots ?? [];
				//console.log('✅ Slots encontrados:', availableSlots.length);
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

		// 1. Coleta de Dados
		const profile_id = formData.get('profile_id') as string;
		const service_id = formData.get('service_id') as string;
		const selected_date = formData.get('selected_date') as string;
		const slot_start_time = formData.get('slot_start') as string;
		const customer_name = formData.get('customer_name') as string;
		const customer_phone = formData.get('customer_phone') as string;

		// 2. Validação básica
		if (!customer_name || !customer_phone || !selected_date || !slot_start_time) {
			return fail(400, { message: 'Preencha todos os campos obrigatórios.' });
		}

		// --- INÍCIO DA LÓGICA INTELIGENTE DE CLIENTE ---
		let finalCustomerId: string;

		// Busca clientes existentes com esse telefone para este profissional
		const { data: existingCustomers } = await supabase
			.from('customers')
			.select('id, name')
			.eq('profile_id', profile_id)
			.eq('phone', customer_phone);

		if (existingCustomers && existingCustomers.length > 0) {
			const inputWords = customer_name
				.toLowerCase()
				.split(/\s+/)
				.filter((w) => w.length > 2);

			// Tenta encontrar um match de nome (ao menos uma palavra em comum)
			const matchedCustomer = existingCustomers.find((c) => {
				const dbWords = c.name.toLowerCase().split(/\s+/);
				return inputWords.some((word) => dbWords.includes(word));
			});

			if (matchedCustomer) {
				finalCustomerId = matchedCustomer.id;
				// Opcional: atualizar o nome se o novo for mais completo
				if (customer_name.length > matchedCustomer.name.length) {
					await supabase
						.from('customers')
						.update({ name: customer_name })
						.eq('id', matchedCustomer.id);
				}
			} else {
				// Telefone igual mas nome totalmente diferente = Novo Cliente
				const { data: newCustomer, error: err } = await supabase
					.from('customers')
					.insert({ profile_id, name: customer_name, phone: customer_phone })
					.select('id')
					.single();
				if (err) return fail(500, { message: 'Erro ao criar novo perfil de cliente.' });
				finalCustomerId = newCustomer.id;
			}
		} else {
			// Telefone novo = Novo Cliente
			const { data: newCustomer, error: err } = await supabase
				.from('customers')
				.insert({ profile_id, name: customer_name, phone: customer_phone })
				.select('id')
				.single();
			if (err) return fail(500, { message: 'Erro ao cadastrar cliente.' });
			finalCustomerId = newCustomer.id;
		}
		// --- FIM DA LÓGICA DE CLIENTE ---

		// 3. Buscar duração do serviço
		const { data: service, error: serviceError } = await supabase
			.from('services')
			.select('duration')
			.eq('id', service_id)
			.single();

		if (serviceError || !service) {
			return fail(400, { message: 'Serviço não encontrado.' });
		}

		// 4. Montar o TSRANGE (Formato Postgres)
		let slotString: string;
		try {
			const [year, month, day] = selected_date.split('-').map(Number);
			const [hour, minute] = slot_start_time.split(':').map(Number);

			const start = new CalendarDateTime(year, month, day, hour, minute);
			const end = start.add({ minutes: service.duration });

			const startFmt = start.toString().replace('T', ' ');
			const endFmt = end.toString().replace('T', ' ');
			slotString = `[${startFmt}, ${endFmt})`;
		} catch (e) {
			return fail(400, { message: 'Data ou horário inválidos.' });
		}

		// 5. Inserir Agendamento
		const { error: appointmentError } = await supabase.from('appointments').insert({
			profile_id,
			customer_id: finalCustomerId, // Usando o ID inteligente
			service_id,
			slot: slotString,
			status: 'pending'
		});

		if (appointmentError) {
			if (appointmentError.code === '23P01') {
				return fail(400, { message: 'Este horário acabou de ser ocupado.' });
			}
			return fail(500, { message: 'Erro ao salvar agendamento.' });
		}

		return { success: true };
	}
};
