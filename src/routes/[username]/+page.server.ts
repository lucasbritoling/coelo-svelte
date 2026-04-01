import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

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
	createAppointment: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		const profile_id = formData.get('profile_id') as string;
		const service_id = formData.get('service_id') as string;
		const slot_start_iso = formData.get('slot_start') as string; // Ex: "2026-04-01T09:00:00Z"
		const customer_name = formData.get('customer_name') as string;
		const customer_phone = formData.get('customer_phone') as string;

		if (!customer_name || !customer_phone) {
			return fail(400, { message: 'Nome e telefone são obrigatórios.' });
		}

		// 1. Garantir que o cliente existe na tabela public.customers
		// Usamos upsert para evitar duplicados se o cliente agendar novamente
		const { data: customer, error: customerError } = await supabase
			.from('customers')
			.upsert(
				{
					full_name: customer_name,
					phone: customer_phone,
					profile_id: profile_id // Vincula este cliente ao profissional
				},
				{ onConflict: 'phone' }
			)
			.select('id')
			.single();

		if (customerError || !customer) {
			console.error('Erro ao processar cliente:', customerError);
			return fail(500, { message: 'Erro ao registar dados do cliente.' });
		}

		// 2. Obter a duração do serviço para calcular o fim do slot
		const { data: service } = await supabase
			.from('services')
			.select('duration')
			.eq('id', service_id)
			.single();

		if (!service) return fail(400, { message: 'Serviço não encontrado.' });

		// 3. Montar o tstzrange (slot)
		const startDate = new Date(slot_start_iso);
		const endDate = new Date(startDate.getTime() + service.duration * 60000);
		const slot = `[${startDate.toISOString()}, ${endDate.toISOString()})`;

		// 4. Inserir na tabela public.appointments
		const { error: appointmentError } = await supabase.from('appointments').insert({
			slot,
			customer_id: customer.id,
			service_id,
			profile_id,
			status: 'pending'
		});

		if (appointmentError) {
			// Erro de sobreposição (Constraint EXCLUDE do GIST)
			if (appointmentError.code === '23P01') {
				return fail(400, {
					message: 'Horário indisponível: este slot coincide com outro agendamento.'
				});
			}
			console.error('Erro ao agendar:', appointmentError);
			return fail(500, { message: 'Erro ao salvar agendamento.' });
		}

		return { success: true };
	}
};
