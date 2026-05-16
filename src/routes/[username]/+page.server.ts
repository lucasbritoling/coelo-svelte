import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { sql, supabase } }) => {
	const { username } = params;
	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');

	// 1. Busca perfil, serviços e a nova config de slot_generation_mode
	const [profile] = await sql<any[]>`
        SELECT 
            p.id, p.full_name, p.username, p.avatar_url, p.slot_generation_mode,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'duration', s.duration,
                        'min_notice_hours', s.min_notice_hours,
                        'buffer_after_min', s.buffer_after_min
                    )
                ) FILTER (WHERE s.id IS NOT NULL AND s.is_active = true), 
                '[]'
            ) as services
        FROM profiles p
        LEFT JOIN services s ON s.profile_id = p.id
        WHERE p.username = ${username}
        GROUP BY p.id
    `;

	if (!profile) throw error(404, 'Profissional não encontrado');

	// Processamento de Avatar
	if (profile.avatar_url) {
		const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
		profile.avatar_url = data.publicUrl;
	}

	const services = profile.services;
	const activeServicesCount = services.length;

	// Determinar o Estado da UI
	let uiState: 'unavailable' | 'single_service' | 'multiple_services' = 'multiple_services';
	if (activeServicesCount === 0) {
		uiState = 'unavailable';
	} else if (activeServicesCount === 1) {
		uiState = 'single_service';
	}

	// Definir o serviço selecionado logicamente
	const selectedService =
		uiState === 'single_service' ? services[0] : services.find((s: any) => s.id === serviceId);

	// 2. LOGICA DE DIAS DISPONÍVEIS (Para o Calendário)
	let availableDays: string[] = [];

	if (selectedService) {
		// Define a janela de busca do calendário: Hoje até +35 dias
		const today = new Date();
		const endDate = new Date();
		endDate.setDate(today.getDate() + 90);

		const startDateStr = today.toISOString().split('T')[0];
		const endDateStr = endDate.toISOString().split('T')[0];

		// Roda a nova RPC para descobrir quais dias possuem horários livres
		const daysRows = await sql<any[]>`
            SELECT available_date::text 
            FROM get_available_days_selfbooking(
                ${profile.id}, 
                ${selectedService.id}, 
                ${startDateStr}::date, 
                ${endDateStr}::date, 
                ${selectedService.duration}::integer,
                ${profile.slot_generation_mode ?? 'flexible'}
            )
        `;
		availableDays = daysRows.map((r) => r.available_date);
	}

	// 3. Busca de Slots (Se uma data foi clicada)
	let slots = [];
	if (date && selectedService) {
		slots = await sql`
            SELECT slot_start, slot_end 
            FROM get_available_slots_selfbooking(
                ${profile.id}, 
                ${selectedService.id}, 
                ${date}::date, 
                ${selectedService.duration}::integer,
                ${profile.slot_generation_mode ?? 'flexible'}
            )
        `;
	}

	return {
		professional: {
			id: profile.id,
			full_name: profile.full_name,
			username: profile.username,
			avatar_url: profile.avatar_url
		},
		services,
		slots,
		availableDays, // Array de strings ['2026-05-16', '2026-05-18', ...]
		uiState,
		selectedDate: date,
		selectedServiceId: selectedService?.id ?? null
	};
};
export const actions: Actions = {
	finishSelfBooking: async ({ request, locals: { sql } }) => {
		const formData = await request.formData();

		// Captura os dados
		const profile_id = formData.get('profile_id') as string;
		const service_id = formData.get('service_id') as string;
		const customer_name = formData.get('customer_name') as string;
		const customer_phone = formData.get('customer_phone') as string;
		const selected_date = formData.get('selected_date') as string;
		const slot_start = formData.get('slot_start') as string;

		// 1. VALIDAÇÃO AMPLIADA (Onde o erro estava escapando)
		// Adicionei profile_id e service_id na checagem obrigatória
		if (
			!profile_id ||
			!service_id ||
			!customer_name ||
			!customer_phone ||
			!selected_date ||
			!slot_start
		) {
			console.error('--- ERRO DE VALIDAÇÃO ---');
			console.table({
				profile_id,
				service_id,
				customer_name,
				customer_phone,
				selected_date,
				slot_start
			});
			return fail(400, { message: 'Dados de identificação do agendamento ausentes.' });
		}

		try {
			// 2. Chamada da RPC com casting explícito
			const result = await sql`
            SELECT finish_self_booking(
                ${profile_id}::uuid,
                ${service_id}::uuid,
                ${customer_name},
                ${customer_phone},
                ${selected_date}::date,
                ${slot_start}::time
            ) as id
        `;

			const appointmentId = result[0]?.id;

			if (!appointmentId) {
				return fail(500, { message: 'O banco de dados não retornou um ID de agendamento.' });
			}

			return {
				success: true,
				appointmentId
			};
		} catch (err: any) {
			// Logs inteligentes para o seu terminal
			console.error('--- FALHA NA RPC finish_self_booking ---');
			console.error('Mensagem:', err.message);
			console.error('Código Postgres:', err.code);

			// Erro de concorrência (Horário ocupado entre o clique e o envio)
			if (err.code === '23P01' || err.message?.includes('ocupado')) {
				return fail(409, {
					message: 'Ops! Alguém acabou de reservar esse horário. Por favor, escolha outro.'
				});
			}

			return fail(400, { message: err.message || 'Erro ao processar o agendamento no servidor.' });
		}
	}
};
