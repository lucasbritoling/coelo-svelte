import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({
	params,
	url,
	setHeaders,
	locals: { sql, supabase }
}) => {
	const { username } = params;
	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');

	// 1. Busca perfil (incluindo timezone), serviços ativos
	const [profile] = await sql<any[]>`
        SELECT 
            p.id, p.full_name, p.username, p.avatar_url, p.slot_generation_mode, p.timezone,
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

	// 2. BUSCA DE DIAS DISPONÍVEIS (Indexada e Instantânea)
	let availableDays: string[] = [];

	if (selectedService) {
		const today = new Date();
		const endDate = new Date();
		endDate.setDate(today.getDate() + 90); // Varre os próximos 90 dias

		const startDateStr = today.toISOString().split('T')[0];
		const endDateStr = endDate.toISOString().split('T')[0];

		// Bate direto no índice parcial da tabela física de slots pré-calculados
		const daysRows = await sql<any[]>`
            SELECT DISTINCT slot_date::text as available_date
            FROM public.generated_slots
            WHERE profile_id = ${profile.id}
              AND service_id = ${selectedService.id}
              AND slot_date BETWEEN ${startDateStr}::date AND ${endDateStr}::date
              AND is_available = true
              AND is_booked = false
            ORDER BY available_date
        `;
		availableDays = daysRows.map((r) => r.available_date);
	}

	// 3. BUSCA DE SLOTS DO DIA SELECIONADO (Conversão do tstzrange para a Timezone do Profissional)
	let slots = [];
	if (date && selectedService) {
		slots = await sql`
            SELECT 
                (lower(slot) AT TIME ZONE ${profile.timezone})::time::text as slot_start,
                (upper(slot) AT TIME ZONE ${profile.timezone})::time::text as slot_end
            FROM public.generated_slots
            WHERE profile_id = ${profile.id}
              AND service_id = ${selectedService.id}
              AND slot_date = ${date}::date
              AND is_available = true
              AND is_booked = false
            ORDER BY slot_start
        `;
	}

	// 4. ATIVAÇÃO DO CACHE DE BORDA OTIMIZADO
	if (selectedService) {
		setHeaders({
			// Cache local de 1s, permite que a borda sirva cache por até 9s enquanto atualiza em background
			'cache-control': 'public, max-age=1, stale-while-revalidate=9'
		});
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
		availableDays,
		uiState,
		selectedDate: date,
		selectedServiceId: selectedService?.id ?? null
	};
};

export const actions: Actions = {
	finishSelfBooking: async ({ request, locals: { sql } }) => {
		const formData = await request.formData();

		const profile_id = formData.get('profile_id') as string;
		const service_id = formData.get('service_id') as string;
		const customer_name = formData.get('customer_name') as string;
		const customer_phone = formData.get('customer_phone') as string;
		const selected_date = formData.get('selected_date') as string;
		const slot_start = formData.get('slot_start') as string; // Ex: "14:30:00"

		// Validação básica de payload de entrada
		if (
			!profile_id ||
			!service_id ||
			!customer_name ||
			!customer_phone ||
			!selected_date ||
			!slot_start
		) {
			return fail(400, { message: 'Dados de identificação do agendamento ausentes.' });
		}

		try {
			// Executa a função orquestradora nativa no Postgres em uma única chamada de rede
			const [result] = await sql<{ appointment_id: string }[]>`
            SELECT public.finish_self_booking(
                ${profile_id}::uuid,
                ${service_id}::uuid,
                ${selected_date}::date,
                ${slot_start}::time,
                ${customer_name}::text,
                ${customer_phone}::text
            ) AS appointment_id
        `;

			return {
				success: true,
				appointmentId: result.appointment_id
			};
		} catch (err: any) {
			console.error('--- FALHA NO SELFBOOKING ---', err.message);

			// Tratamento amigável das exceções de negócio lançadas pelo Postgres
			if (err.message.includes('SLOT_ALREADY_BOOKED')) {
				return fail(409, {
					message: 'Ops! Alguém acabou de reservar esse horário. Por favor, escolha outro.'
				});
			}

			if (err.message.includes('INSUFFICIENT_NOTICE')) {
				return fail(400, {
					message: 'O tempo mínimo de antecedência exigido para este serviço não foi respeitado.'
				});
			}

			if (err.message.includes('SERVICE_INACTIVE')) {
				return fail(400, {
					message: 'Este serviço não está aceitando novos agendamentos no momento.'
				});
			}

			if (err.message.includes('SERVICE_NOT_FOUND')) {
				return fail(404, { message: 'O serviço solicitado não foi encontrado.' });
			}

			if (err.message.includes('PROFILE_ID_NULL')) {
				return fail(400, { message: 'Perfil do profissional inválido ou ausente.' });
			}

			// Fallback para qualquer outro erro inesperado do banco ou da rede
			return fail(500, { message: 'Erro interno ao processar seu agendamento.' });
		}
	}
};
