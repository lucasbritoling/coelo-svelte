import { dateUtils } from '$lib/utils/date';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { today, getLocalTimeZone } from '@internationalized/date';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema, serviceSchema } from '$lib/schemas/app';

interface DatabaseError extends Error {
	code?: string;
}

// Função auxiliar para higienizar e garantir um fuso horário válido IANA
function getSafeTimezone(cookies: any, platform: any, inputTz?: string | null): string {
	const tz = inputTz || cookies.get('timezone') || platform?.cf?.timezone || 'America/Sao_Paulo';
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return tz;
	} catch (e) {
		return 'America/Sao_Paulo'; // Fallback absoluto se a string for corrompida/inválida
	}
}

export const load: PageServerLoad = async ({ url, cookies, platform, locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	const dateParam = url.searchParams.get('date') || dateUtils.today();
	const searchQuery = url.searchParams.get('q')?.trim() ?? '';

	// Resolve o fuso usando a esteira de resiliência tripla
	const activeTz = getSafeTimezone(cookies, platform);

	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
		throw error(400, 'Data inválida');
	}

	try {
		const [rpcResult, customerForm, serviceForm] = await Promise.all([
			sql`SELECT load_agenda(${user.id}::uuid, ${dateParam}::date, ${searchQuery}, ${activeTz}) as data`,
			superValidate(zod4(customerSchema)),
			superValidate(zod4(serviceSchema))
		]);

		const agenda = rpcResult[0]?.data;
		if (!agenda) {
			throw error(500, 'Falha catastrófica ao estruturar os dados da agenda.');
		}

		return {
			appointments: agenda.appointments ?? [],
			customers: agenda.customers ?? [],
			services: agenda.services ?? [],
			workingHours: agenda.workingHours ?? [],
			username: agenda.profile?.username ?? 'user',
			selectedDate: dateParam,
			timezone: activeTz,
			customerForm,
			serviceForm,
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
	create: async ({ request, cookies, platform, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const customer_id = formData.get('customer_id')?.toString();
		const service_id = formData.get('service_id')?.toString();
		const date = formData.get('date')?.toString();
		const start_at = formData.get('start_at')?.toString();
		const end_at = formData.get('end_at')?.toString();

		// Alinha a resiliência da Action com a mesma estratégia do Load
		const tz = getSafeTimezone(cookies, platform, formData.get('tz')?.toString());

		if (!customer_id || !service_id || !date || !start_at || !end_at) {
			return fail(400, { message: 'Dados incompletos.' });
		}

		// Montagem limpa das strings locais para o banco processar
		const startLocalStr = `${date} ${start_at}:00`;
		const endLocalStr = `${date} ${end_at}:00`;

		try {
			// CORREÇÃO CRUCIAL: Passa as variáveis isoladas. O driver as converte em $1, $2, $3...
			// O construtor tstzrange avalia os timestamps locais aplicando o fuso dinamicamente de forma segura.
			await sql`
        INSERT INTO appointments (customer_id, service_id, profile_id, slot, status)
        VALUES (
            ${customer_id}, 
            ${service_id}, 
            ${user.id}, 
            tstzrange(
                (${startLocalStr} || ' ' || ${tz})::timestamptz, 
                (${endLocalStr} || ' ' || ${tz})::timestamptz
            ), 
            'pending'
        )
    `;
			return { success: true };
		} catch (err) {
			const dbError = err as DatabaseError;
			// Erro 23P01: Restrição de exclusão do GIST (Horário conflitante detectado no Postgres)
			if (dbError.code === '23P01') {
				return fail(400, {
					message: 'Horário indisponível: coincide com outro agendamento.'
				});
			}
			console.error('Erro ao criar agendamento:', dbError);
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
