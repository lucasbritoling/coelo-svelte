import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { today, getLocalTimeZone } from '@internationalized/date';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema, serviceSchema } from '$lib/schemas/app';

export const load: PageServerLoad = async ({ url, locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	// 1. Validação estrita da data para evitar ataques de string ou lixo na query
	const dateParam = url.searchParams.get('date') ?? today(getLocalTimeZone()).toString();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
		throw error(400, 'Data inválida');
	}

	try {
		const [customerForm, serviceForm, rawAppointments, customers, services, profile] =
			await Promise.all([
				superValidate(zod4(customerSchema)),
				superValidate(zod4(serviceSchema)),

				// 2. Query de Appointments: Mais performática e segura
				sql`
                SELECT 
                    a.id, a.status, 
                    to_char(lower(a.slot), 'HH24:MI') as start_at,
                    to_char(upper(a.slot), 'HH24:MI') as end_at,
                    c.name as customer_name,
                    s.name as service_name,
                    s.duration as service_duration
                FROM appointments a
                JOIN customers c ON a.customer_id = c.id
                JOIN services s ON a.service_id = s.id
                WHERE a.profile_id = ${user.id}
                  -- Filtro exato por dia usando cast para DATE
                  AND lower(a.slot)::date = ${dateParam}::date
                ORDER BY lower(a.slot) ASC
            `,

				// 3. Clientes com LIMIT (Segurança de memória)
				// Se tiver mais de 100, o ideal é usar um combo-box com busca
				sql`SELECT id, name FROM customers 
                    WHERE profile_id = ${user.id} 
                    ORDER BY name 
                    LIMIT 100`,

				sql`SELECT id, name, duration FROM services 
                    WHERE profile_id = ${user.id} AND is_active = true 
                    ORDER BY name`,

				sql`SELECT username FROM profiles WHERE id = ${user.id} LIMIT 1`.then((r) => r[0])
			]);

		return {
			appointments: rawAppointments,
			customers,
			services,
			username: profile?.username ?? 'user',
			selectedDate: dateParam,
			customerForm,
			serviceForm
		};
	} catch (err) {
		// Log detalhado internamente, mas mensagem genérica para o usuário
		console.error(`[Agenda Load Error] User: ${user.id}, Date: ${dateParam}:`, err);
		throw error(500, 'Não foi possível carregar a agenda.');
	}
};

function formatarHora(val: any): string {
	if (!val) return '';
	// Se o Postgres devolver objeto Date
	if (val instanceof Date) {
		return val.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
	}
	// Se devolver string (ex: "2024-05-20 09:00:00")
	if (typeof val === 'string') {
		const match = val.match(/(\d{2}:\d{2})/);
		return match ? match[1] : val;
	}
	return String(val);
}

export const actions: Actions = {
	create: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const customer_id = formData.get('customer_id')?.toString();
		const service_id = formData.get('service_id')?.toString();
		const date = formData.get('date')?.toString();
		const start_at = formData.get('start_at')?.toString();
		const end_at = formData.get('end_at')?.toString();

		if (!customer_id || !service_id || !date || !start_at || !end_at) {
			return fail(400, { message: 'Dados incompletos.' });
		}

		// Formato tsrange: '[YYYY-MM-DD HH:MM:SS, YYYY-MM-DD HH:MM:SS)'
		const slotValue = `[${date} ${start_at}:00, ${date} ${end_at}:00)`;

		try {
			await sql`
                INSERT INTO appointments (customer_id, service_id, profile_id, slot, status)
                VALUES (${customer_id}, ${service_id}, ${user.id}, ${slotValue}, 'pending')
            `;
			return { success: true };
		} catch (err: any) {
			// Erro 23P01: exclusion_violation (GIST EXCLUDE disparou)
			if (err.code === '23P01') {
				return fail(400, {
					message: 'Horário indisponível: coincide com outro agendamento.'
				});
			}
			console.error('Erro ao criar agendamento:', err);
			return fail(500, { message: 'Erro interno ao salvar.' });
		}
	},

	setStatus: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const form = await request.formData();

		const id = form.get('id')?.toString();
		const status = form.get('status')?.toString();

		if (!id || !status) {
			return fail(400, { message: 'Dados inválidos.' });
		}

		const allowedStatuses = ['pending', 'confirmed', 'cancelled'];

		if (!allowedStatuses.includes(status)) {
			return fail(400, { message: 'Status inválido.' });
		}

		try {
			const result = await sql`
			UPDATE appointments
			SET status = ${status}::appointment_status
			WHERE id = ${id}
			AND profile_id = ${user.id}
		`;

			if (result.count === 0) {
				return fail(404, { message: 'Agendamento não encontrado.' });
			}

			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro ao alterar status.' });
		}
	},

	cancel: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);
		const id = (await request.formData()).get('id')?.toString();

		try {
			await sql`
                UPDATE appointments 
                SET status = 'cancelled' 
                WHERE id = ${id} AND profile_id = ${user.id}
            `;
			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro ao cancelar.' });
		}
	},

	delete: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);
		const id = (await request.formData()).get('id')?.toString();

		try {
			await sql`DELETE FROM appointments WHERE id = ${id} AND profile_id = ${user.id}`;
			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro ao excluir.' });
		}
	}
};
