import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { sql } }) => {
	const { username } = params;
	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');

	try {
		// 1. Busca perfil e serviços em uma única query
		const rows = await sql`
            SELECT 
                p.id, p.full_name, p.username, p.avatar_url,
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'duration', s.duration,
                        'min_notice_hours', s.min_notice_hours,
                        'buffer_after_min', s.buffer_after_min
                    )
                ) FILTER (WHERE s.id IS NOT NULL) as services
            FROM profiles p
            LEFT JOIN services s ON s.profile_id = p.id AND s.is_active = true
            WHERE p.username = ${username}
            GROUP BY p.id
        `;

		const profile = rows[0];
		if (!profile) throw error(404, 'Profissional não encontrado');

		const services = profile.services ?? [];
		const hasActiveServices = services.length > 0;

		if (!hasActiveServices) {
			return { professional: profile, services: [], slots: [], hasActiveServices: false };
		}

		const autoServiceId = services.length === 1 ? String(services[0].id) : null;
		const effectiveServiceId = serviceId ?? autoServiceId;

		let availableSlots = [];

		// 2. Busca slots usando a função do banco via SQL puro
		if (date && effectiveServiceId) {
			const selectedService = services.find((s: any) => s.id == effectiveServiceId);

			if (selectedService) {
				// Chamada direta da função no Postgres via Hyperdrive
				availableSlots = await sql`
                    SELECT * FROM get_available_slots(
                        ${profile.id}, 
                        ${selectedService.id}, 
                        ${date}::date, 
                        ${selectedService.duration}::smallint
                    )
                `;
			}
		}

		return {
			professional: { ...profile, services: undefined },
			services,
			slots: availableSlots,
			selectedDate: date,
			selectedServiceId: effectiveServiceId,
			singleService: services.length === 1,
			hasActiveServices: true
		};
	} catch (err: any) {
		if (err.status === 404) throw err;
		console.error('Erro na página pública:', err);
		throw error(500, 'Erro ao carregar dados.');
	}
};

export const actions: Actions = {
	finishSelfBooking: async ({ request, locals: { sql } }) => {
		const formData = await request.formData();
		const profile_id = formData.get('profile_id') as string;
		const service_id = formData.get('service_id') as string;
		const customer_name = formData.get('customer_name') as string;
		const customer_phone = formData.get('customer_phone') as string;
		const selected_date = formData.get('selected_date') as string;
		const slot_start = formData.get('slot_start') as string;

		if (!customer_name || !customer_phone || !selected_date || !slot_start) {
			return fail(400, { message: 'Preencha todos os campos obrigatórios.' });
		}

		try {
			// Executa a transação de agendamento diretamente no banco
			// A função finish_self_booking deve estar definida no seu Postgres
			await sql`
                SELECT finish_self_booking(
                    ${profile_id}::uuid,
                    ${service_id}::uuid,
                    ${customer_name},
                    ${customer_phone},
                    ${selected_date}::date,
                    ${slot_start}::time
                )
            `;

			return { success: true };
		} catch (err: any) {
			console.error('Erro no agendamento:', err);

			// Tratamento de erros baseado em códigos do Postgres ou mensagens da função
			if (err.code === '23P01' || err.message?.includes('ocupado')) {
				return fail(400, { message: 'Este horário acabou de ser ocupado por outro cliente.' });
			}

			return fail(400, { message: err.message || 'Erro ao processar agendamento.' });
		}
	}
};
