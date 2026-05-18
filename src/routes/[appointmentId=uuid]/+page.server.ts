// src/routes/[appointmentId]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { sql } }) => {
	const { appointmentId } = params;

	try {
		const result = await sql`
            SELECT 
                a.id,
                lower(a.slot) as start_timestamp,
                s.name as service_name,
                p.full_name as professional_full_name,
                p.username as professional_username,
                c.name as customer_name
            FROM public.appointments a
            JOIN public.services s ON a.service_id = s.id
            JOIN public.profiles p ON a.profile_id = p.id
            JOIN public.customers c ON a.customer_id = c.id
            WHERE a.id = ${appointmentId}::uuid
            LIMIT 1
        `;

		const row = result[0];

		if (!row) {
			throw error(404, 'Agendamento não encontrado.');
		}

		// Convertemos para instância de Date e pegamos o valor Unix absoluto em milissegundos
		const startDate = new Date(row.start_timestamp);

		return {
			appointment: {
				id: row.id,
				customer_name: row.customer_name,
				// Passamos o timestamp puro para o cliente resolver o fuso
				startMs: startDate.getTime(),
				service_name: row.service_name
			},
			professional: {
				full_name: row.professional_full_name,
				username: row.professional_username
			}
		};
	} catch (err) {
		console.error('Erro:', err);
		throw error(404, 'Link de agendamento inválido.');
	}
};
