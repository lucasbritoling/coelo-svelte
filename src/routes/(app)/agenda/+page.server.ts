import { dateUtils } from '$lib/utils/date';
import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema, serviceSchema } from '$lib/schemas/app';

interface DatabaseError extends Error {
	code?: string;
}

function getSafeTimezone(cookies: any, platform: any, inputTz?: string | null): string {
	const tz = inputTz || cookies.get('timezone') || platform?.cf?.timezone || 'America/Sao_Paulo';
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return tz;
	} catch (e) {
		return 'America/Sao_Paulo';
	}
}

export const load: PageServerLoad = async ({ url, cookies, platform, locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	const dateParam = url.searchParams.get('date') || dateUtils.today();
	const activeTz = getSafeTimezone(cookies, platform);

	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
		throw error(400, 'Data inválida');
	}

	try {
		// Executa em paralelo a chamada limpa do banco e as validações do Superforms
		const [rpcResult, customerForm, serviceForm] = await Promise.all([
			sql`SELECT public.load_agenda(
				${user.id}::uuid, 
				${dateParam}::date, 
				${activeTz}::text
			) as data`,
			superValidate(zod4(customerSchema)),
			superValidate(zod4(serviceSchema))
		]);

		const agenda = rpcResult[0]?.data;
		if (!agenda) {
			throw error(500, 'Falha catastrófica ao estruturar os dados da agenda.');
		}

		return {
			appointments: agenda.appointments ?? [],
			services: agenda.services ?? [],
			workingHours: agenda.workingHours ?? [],
			username: agenda.profile?.username ?? 'user',
			selectedDate: dateParam,
			timezone: activeTz,
			customerForm,
			serviceForm,
			// Mantido array vazio por compatibilidade com componentes que dependem da prop
			customers: [],
			favoriteGhostSlotInterval: agenda.profile?.favorite_ghost_slot_interval ?? 30,
			user: {
				...user,
				lunch_settings: {
					has_lunch: agenda.profile?.has_lunch ?? false,
					lunch_start: agenda.profile?.lunch_start ?? '12:00',
					lunch_end: agenda.profile?.lunch_end ?? '13:00'
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

		// Resolve o formData de uma vez
		const formData = await request.formData();

		const customer_id = formData.get('customer_id')?.toString();
		const service_id = formData.get('service_id')?.toString();
		const date = formData.get('date')?.toString();
		const start_at = formData.get('start_at')?.toString();
		const end_at = formData.get('end_at')?.toString();

		if (!customer_id || !service_id || !date || !start_at || !end_at) {
			return fail(400, { message: 'Dados incompletos.' });
		}

		// Evita processamento desnecessário de string antes da validação acima
		const tz = getSafeTimezone(cookies, platform, formData.get('tz')?.toString());
		const startLocalStr = `${date} ${start_at}:00`;
		const endLocalStr = `${date} ${end_at}:00`;

		try {
			// 1 ÚNICO ROUND-TRIP DE REDE: Toda a transação ocorre nativamente no banco
			await sql`
				SELECT public.action_create_appointment(
					${customer_id}, 
					${service_id}, 
					${user.id}, 
					${startLocalStr}, 
					${endLocalStr}, 
					${tz}
				)
			`;

			return { success: true };
		} catch (err) {
			// O Postgres repassa o código de erro de exclusão (23P01) normalmente através da função
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
			const txResult = await sql.begin(async (sql) => {
				// 1. Atualiza o status e captura o slot original do agendamento
				const result = await sql`
                    UPDATE appointments
                    SET status = ${status}::appointment_status
                    WHERE id = ${id} AND profile_id = ${user.id}
                    RETURNING id, slot
                `;

				if (result.count === 0) return { error: 'not_found' };
				const appt = result[0];

				if (status === 'cancelled') {
					// 2a. Se cancelou, libera os slots físicos vinculados a ele
					await sql`
                        UPDATE public.generated_slots
                        SET is_booked = false, appointment_id = NULL
                        WHERE appointment_id = ${appt.id} AND profile_id = ${user.id}
                    `;
				} else {
					// 2b. Se reativou (pending/confirmed), re-ocupa os slots que batem com o horário
					await sql`
                        UPDATE public.generated_slots
                        SET is_booked = true, appointment_id = ${appt.id}
                        WHERE profile_id = ${user.id}
                          AND slot && ${appt.slot}
                    `;
				}

				// 3. Atualiza a esteira
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
				return { success: true };
			});

			if (txResult?.error === 'not_found') {
				return fail(404, { message: 'Agendamento não encontrado.' });
			}

			return { success: true };
		} catch (err) {
			console.error('Erro ao alterar status:', err);
			return fail(500, { message: 'Erro interno ao alterar status.' });
		}
	},

	cancel: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);
		const id = (await request.formData()).get('id')?.toString();
		if (!id) return fail(400, { message: 'ID obrigatório.' });

		try {
			const txResult = await sql.begin(async (sql) => {
				const result = await sql`
                    UPDATE appointments 
                    SET status = 'cancelled' 
                    WHERE id = ${id} AND profile_id = ${user.id}
                    RETURNING id
                `;

				if (result.count === 0) return { error: 'not_found' };

				// Libera o slot imediatamente no banco físico
				await sql`
                    UPDATE public.generated_slots
                    SET is_booked = false, appointment_id = NULL
                    WHERE appointment_id = ${id} AND profile_id = ${user.id}
                `;

				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
				return { success: true };
			});

			if (txResult?.error === 'not_found') {
				return fail(404, { message: 'Agendamento não encontrado.' });
			}

			return { success: true };
		} catch (err) {
			console.error('Erro ao cancelar agendamento:', err);
			return fail(500, { message: 'Erro interno ao cancelar.' });
		}
	},

	delete: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const id = (await request.formData()).get('id')?.toString();
		if (!id) return fail(400, { message: 'ID obrigatório.' });

		try {
			// Uma única chamada ao banco resolve todo o problema
			const [result] = await sql<{ was_cancelled: boolean }[]>`
            SELECT public.action_cancel_appointment(${id}, ${user.id}) AS was_cancelled
        `;

			if (!result?.was_cancelled) {
				return fail(404, { message: 'Agendamento não encontrado.' });
			}

			return { success: true };
		} catch (err) {
			console.error('Erro ao excluir agendamento:', err);
			return fail(500, { message: 'Erro interno ao excluir.' });
		}
	}
};
