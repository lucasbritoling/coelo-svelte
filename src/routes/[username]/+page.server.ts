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

	const services = profile?.services;
	const autoServiceId = services?.length === 1 ? String(services[0].id) : null;

	const effectiveServiceId = serviceId ?? autoServiceId;

	let availableSlots = [];

	// --- LOG DE ENTRADA ---
	//console.log('--- DEBUG AGENDAMENTO ---');
	//console.log('Parâmetros da URL:', { date, serviceId });

	if (date && serviceId) {
		// 2. TENTATIVA DE ENCONTRAR O SERVIÇO
		// Usamos == (dois iguais) caso o ID no banco seja número e na URL string
		const selectedService = profile.services.find((s) => s.id == effectiveServiceId);

		//console.log('Serviço selecionado encontrado?', !!selectedService);

		if (date && selectedService) {
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
				//console.error('❌ ERRO NA RPC:', rpcError.message);
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
		selectedServiceId: effectiveServiceId,
		singleService: services.length === 1
	};
};

export const actions: Actions = {
	finishSelfBooking: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();

		const payload = {
			p_profile_id: formData.get('profile_id') as string,
			p_service_id: formData.get('service_id') as string,
			p_customer_name: formData.get('customer_name') as string,
			p_customer_phone: formData.get('customer_phone') as string,
			p_selected_date: formData.get('selected_date') as string, // 'YYYY-MM-DD'
			p_slot_start_time: formData.get('slot_start') as string // 'HH:mm'
		};

		// Validação básica
		if (Object.values(payload).some((v) => !v)) {
			return fail(400, { message: 'Preencha todos os campos obrigatórios.' });
		}

		// Chama a RPC que agora contém toda a inteligência
		const { error: rpcError } = await supabase.rpc('finish_self_booking', payload);

		if (rpcError) {
			console.error('Erro no agendamento:', rpcError.message);
			if (rpcError.code === '23P01' || rpcError.message.includes('ocupado')) {
				return fail(400, { message: 'Este horário acabou de ser ocupado.' });
			}
			return fail(500, { message: 'Erro ao processar agendamento.' });
		}

		return { success: true };
	}
};
