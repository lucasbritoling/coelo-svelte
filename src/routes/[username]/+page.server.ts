import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { sql, supabase } }) => {
	const { username } = params;
	const date = url.searchParams.get('date');
	const serviceId = url.searchParams.get('serviceId');

	try {
		// 1. Busca perfil e serviços usando SQL nativo para velocidade máxima na borda
		const rows = await sql`
            SELECT 
                p.id, p.full_name, p.username, p.avatar_url,
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'duration', s.duration,
                        'price', s.price,
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
			return {
				professional: profile,
				services: [],
				slots: [],
				hasActiveServices: false
			};
		}

		// Lógica de ID de serviço efetivo
		const autoServiceId = services.length === 1 ? String(services[0].id) : null;
		const effectiveServiceId = serviceId ?? autoServiceId;

		let availableSlots = [];

		if (date && effectiveServiceId) {
			const selectedService = services.find((s: any) => s.id == effectiveServiceId);

			if (selectedService) {
				// Chamamos a RPC via SDK do Supabase (que é um wrapper para POST /rpc/...)
				// Mas note: como você já tem a conexão sql (Hyperdrive),
				// você PODERIA chamar sql`SELECT * FROM get_available_slots(...)`.
				// Vamos manter o SDK aqui para não quebrar a lógica interna da sua função PL/pgSQL.
				const { data: slots, error: rpcError } = await supabase.rpc('get_available_slots', {
					p_profile_id: profile.id,
					p_service_id: selectedService.id,
					p_date: date,
					p_service_duration_min: selectedService.duration
				});

				if (!rpcError) {
					availableSlots = slots ?? [];
				}
			}
		}

		return {
			professional: {
				...profile,
				services: undefined // Removemos para não duplicar dados no retorno
			},
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
		throw error(500, 'Erro ao carregar agendamentos.');
	}
};

export const actions: Actions = {
	finishSelfBooking: async ({ request, locals: { sql, supabase } }) => {
		const formData = await request.formData();
		const profile_id = formData.get('profile_id') as string;
		const service_id = formData.get('service_id') as string;

		// Validação rápida via SQL
		const [serviceMatch] = await sql`
            SELECT id FROM services 
            WHERE id = ${service_id} AND profile_id = ${profile_id} AND is_active = true
        `;

		if (!serviceMatch) {
			return fail(400, { message: 'Serviço inválido.' });
		}

		const payload = {
			p_profile_id: profile_id,
			p_service_id: service_id,
			p_customer_name: formData.get('customer_name') as string,
			p_customer_phone: formData.get('customer_phone') as string,
			p_selected_date: formData.get('selected_date') as string,
			p_slot_start_time: formData.get('slot_start') as string
		};

		if (Object.values(payload).some((v) => !v)) {
			return fail(400, { message: 'Preencha todos os campos.' });
		}

		// Executa a transação de agendamento via RPC
		const { error: rpcError } = await supabase.rpc('finish_self_booking', payload);

		if (rpcError) {
			if (rpcError.code === '23P01' || rpcError.message.includes('ocupado')) {
				return fail(400, { message: 'Este horário acabou de ser ocupado.' });
			}
			return fail(400, { message: rpcError.message || 'Erro ao processar.' });
		}

		return { success: true };
	}
};
