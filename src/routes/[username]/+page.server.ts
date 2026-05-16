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

	// 1. Busca perfil e serviços ativos (Sem lixo de modos ou intervalos fantasmas)
	const [profile] = await sql<any[]>`
        SELECT 
            p.id, p.full_name, p.username, p.avatar_url, p.timezone,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'duration', s.duration,
                        'min_notice_hours', s.min_notice_hours
                    )
                ) FILTER (WHERE s.id IS NOT NULL AND s.is_active = true), 
                '[]'
            ) as services
        FROM public.profiles p
        LEFT JOIN public.services s ON s.profile_id = p.id
        WHERE p.username = ${username}
        GROUP BY p.id
    `;

	if (!profile) throw error(404, 'Profissional não encontrado');

	if (profile.avatar_url) {
		profile.avatar_url = supabase.storage
			.from('avatars')
			.getPublicUrl(profile.avatar_url).data.publicUrl;
	}

	const services = profile.services;
	const uiState =
		services.length === 0
			? 'unavailable'
			: services.length === 1
				? 'single_service'
				: 'multiple_services';
	const selectedService =
		uiState === 'single_service' ? services[0] : services.find((s: any) => s.id === serviceId);

	// 2. BUSCA DE DIAS DISPONÍVEIS
	let availableDays: string[] = [];
	const todayStr = new Date().toISOString().split('T')[0];
	const endStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

	if (selectedService) {
		const daysRows = await sql<any[]>`
            SELECT DISTINCT gs.slot_date::text as available_date
            FROM public.generated_slots gs
            WHERE gs.profile_id = ${profile.id}
              AND gs.service_id = ${selectedService.id}
              AND gs.slot_date BETWEEN ${todayStr}::date AND ${endStr}::date
              AND gs.is_booked = false
              AND lower(gs.slot) >= NOW() + (${selectedService.min_notice_hours} * INTERVAL '1 hour')
              AND NOT EXISTS (
                  SELECT 1 FROM public.appointments a
                  WHERE a.profile_id = ${profile.id} AND a.status <> 'cancelled' AND gs.slot && a.slot
              )
            ORDER BY available_date
        `;
		availableDays = daysRows.map((r) => r.available_date);
	}

	// 3. BUSCA DE SLOTS DO DIA SELECIONADO
	let slots = [];
	if (date && selectedService) {
		slots = await sql`
            SELECT 
                to_char(lower(gs.slot) AT TIME ZONE ${profile.timezone}, 'HH24:MI') as slot_start,
                to_char(upper(gs.slot) AT TIME ZONE ${profile.timezone}, 'HH24:MI') as slot_end
            FROM public.generated_slots gs
            WHERE gs.profile_id = ${profile.id}
              AND gs.service_id = ${selectedService.id}
              AND gs.slot_date = ${date}::date
              AND gs.is_booked = false
              AND lower(gs.slot) >= NOW() + (${selectedService.min_notice_hours} * INTERVAL '1 hour')
              AND NOT EXISTS (
                  SELECT 1 FROM public.appointments a
                  WHERE a.profile_id = ${profile.id} AND a.status <> 'cancelled' AND gs.slot && a.slot
              )
            ORDER BY slot_start
        `;
	}

	if (selectedService) {
		setHeaders({ 'cache-control': 'public, max-age=0, must-revalidate' });
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
		const data = Object.fromEntries(await request.formData());

		if (
			!data.profile_id ||
			!data.service_id ||
			!data.customer_name ||
			!data.customer_phone ||
			!data.selected_date ||
			!data.slot_start
		) {
			return fail(400, { message: 'Dados de identificação do agendamento ausentes.' });
		}

		try {
			const [result] = await sql<{ appointment_id: string }[]>`
                SELECT public.finish_self_booking(
                    ${data.profile_id}::uuid, ${data.service_id}::uuid, ${data.selected_date}::date, 
                    ${data.slot_start}::time, ${data.customer_name}::text, ${data.customer_phone}::text
                ) AS appointment_id
            `;
			return { success: true, appointmentId: result.appointment_id };
		} catch (err: any) {
			const msg = err.message;
			if (msg.includes('SLOT_ALREADY_BOOKED'))
				return fail(409, {
					message: 'Ops! Alguém acabou de reservar esse horário. Escolha outro.'
				});
			if (msg.includes('INSUFFICIENT_NOTICE'))
				return fail(400, {
					message: 'A antecedência mínima para este serviço não foi respeitada.'
				});
			if (msg.includes('SERVICE_INACTIVE'))
				return fail(400, { message: 'Este serviço não está aceitando novos agendamentos.' });
			if (msg.includes('SERVICE_NOT_FOUND'))
				return fail(404, { message: 'O serviço solicitado não foi encontrado.' });
			return fail(500, { message: 'Erro interno ao processar seu agendamento.' });
		}
	}
};
