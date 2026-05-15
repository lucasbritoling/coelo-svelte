import { dateUtils } from '$lib/utils/date';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { today, getLocalTimeZone } from '@internationalized/date';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema, serviceSchema } from '$lib/schemas/app';

export const load: PageServerLoad = async ({ url, locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	const dateParam = url.searchParams.get('date') || dateUtils.today();
	const searchQuery = url.searchParams.get('q')?.trim() ?? '';

	// Validação básica da data para evitar queries inúteis
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
		throw error(400, 'Data inválida');
	}

	try {
		// 1. Chamada paralela: RPC do Banco + Validação dos Formulários
		const [rpcResult, customerForm, serviceForm] = await Promise.all([
			sql`SELECT load_agenda(${user.id}::uuid, ${dateParam}::date, ${searchQuery}) as data`,
			superValidate(zod4(customerSchema)),
			superValidate(zod4(serviceSchema))
		]);

		// 2. Extração dos dados da RPC
		const agenda = rpcResult[0]?.data;

		if (!agenda) {
			throw error(500, 'Falha catastrófica ao estruturar os dados da agenda.');
		}

		// 3. Normalização dos Appointments (Traduzindo tstzrange para o Front)
		// Garantimos que mapeamos o slot do banco para o padrão de exibição em SP
		const sanitizedAppointments = (agenda.appointments || []).map((appt: any) => {
			if (!appt.slot) return appt;

			// Extrai os horários formatados ("14:00") e timestamps (ms) relativos ao fuso correto
			const { start_at, end_at, startMs, endMs } = dateUtils.parseRange(appt.slot);

			return {
				...appt,
				start_at, // Substitui pela string limpa local para manter compatibilidade com a UI
				end_at, // Substitui pela string limpa local para manter compatibilidade com a UI
				startMs, // Injetado para facilitar ordenações ou cálculos milimétricos no front se precisar
				endMs // Injetado para facilitar ordenações ou cálculos milimétricos no front se precisar
			};
		});

		return {
			// Dados vindos da RPC mapeados de forma segura
			appointments: sanitizedAppointments,
			customers: agenda.customers ?? [],
			services: agenda.services ?? [],
			workingHours: agenda.workingHours ?? [],
			username: agenda.profile?.username ?? 'user',

			// Contexto da página
			selectedDate: dateParam,
			customerForm,
			serviceForm,

			// User injetado com as configurações de almoço vindas do profile
			user: {
				...user,
				lunch_settings: {
					has_lunch: agenda.profile?.has_lunch ?? false,
					lunch_start: agenda.profile?.lunch_start ?? '12:00:00',
					lunch_end: agenda.profile?.lunch_end ?? '13:00:00'
				}
			}
		};
	} catch (err) {
		console.error(`[Agenda Load Error] User: ${user.id}, Date: ${dateParam}:`, err);
		throw error(500, 'Erro ao carregar os dados da agenda.');
	}
};

export const actions: Actions = {
	create: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const customer_id = formData.get('customer_id')?.toString();
		const service_id = formData.get('service_id')?.toString();
		const date = formData.get('date')?.toString();
		const start_at = formData.get('start_at')?.toString();
		const end_at = formData.get('end_at')?.toString();
		const tz = formData.get('tz')?.toString() || 'UTC';

		if (!customer_id || !service_id || !date || !start_at || !end_at) {
			return fail(400, { message: 'Dados incompletos.' });
		}

		// Formato tsrange: '[YYYY-MM-DD HH:MM:SS-03:00, YYYY-MM-DD HH:MM:SS-03:00)'
		const slotValue = `[
    ('${date} ${start_at}:00'::timestamp AT TIME ZONE '${tz}'), 
    ('${date} ${end_at}:00'::timestamp AT TIME ZONE '${tz}')
)`;
		console.log(slotValue);

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
			return fail(500, { message: 'Erro interno ao alterar status.' });
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
			return fail(500, { message: 'Erro interno ao cancelar.' });
		}
	},

	delete: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);
		const id = (await request.formData()).get('id')?.toString();

		try {
			await sql`DELETE FROM appointments WHERE id = ${id} AND profile_id = ${user.id}`;
			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro interno ao excluir.' });
		}
	}
};
