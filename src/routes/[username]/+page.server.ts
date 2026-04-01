import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { supabase } }) => {
	const { username } = params;
	console.log('🔍 Tentando buscar username:', username);

	// 1. Primeiro, buscamos o profissional e seus serviços
	// Isso é o que aparece assim que a página carrega
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select(
			`
        id, 
        full_name, 
        username, 
        avatar_url,
        services (
            id, 
            name, 
            duration,
            price
        )
    `
		)
		.eq('username', username)
		.single();

	// --- ÁREA DE DEBUG ---
	if (profileError) {
		console.error('❌ Erro do Supabase:', {
			code: profileError.code,
			message: profileError.message,
			details: profileError.details,
			hint: profileError.hint
		});
	}

	if (!profile) {
		console.log('⚠️ Perfil não encontrado no banco para o user:', username);

		// Vamos testar se o problema é o filtro.
		// Vamos listar TODOS os usernames pra ver se o seu está lá
		const { data: allUsers } = await supabase.from('profiles').select('username').limit(5);
		console.log(
			'📋 Usernames existentes no banco:',
			allUsers?.map((u) => u.username)
		);
	} else {
		console.log('✅ Perfil carregado com sucesso:', profile.full_name);
		console.log('📦 Serviços encontrados:', profile.services?.length || 0);
	}
	// ---------------------

	if (profileError || !profile) {
		throw error(404, `Profissional "${username}" não encontrado`);
	}

	// 2. Pegamos os parâmetros da URL (se existirem)
	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');

	let availableSlots = [];

	// 3. Só chamamos a RPC se o cliente já escolheu um serviço e uma data
	if (date && serviceId) {
		const selectedService = profile.services.find((s) => s.id === serviceId);

		if (selectedService) {
			const { data: slots } = await supabase.rpc('get_available_slots', {
				p_profile_id: profile.id,
				p_date: date,
				p_service_duration_min: selectedService.duration
			});
			availableSlots = slots ?? [];
		}
	}

	return {
		professional: {
			id: profile.id,
			full_name: profile.full_name,
			username: profile.username,
			avatar_url: profile.avatar_url
		},
		services: profile.services, // Lista para o cliente escolher
		slots: availableSlots, // Horários livres (se houver busca)
		selectedDate: date,
		selectedServiceId: serviceId
	};
};
