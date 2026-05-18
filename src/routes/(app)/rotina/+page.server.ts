import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	if (!user) throw redirect(303, '/login');

	try {
		// 1. Load paralelo com SQL nativo
		const [workingHours, overrides, profileResult] = await Promise.all([
			sql`
                SELECT id, day_of_week, start_time, end_time, is_active 
                FROM working_hours 
                WHERE profile_id = ${user.id} 
                ORDER BY day_of_week ASC
            `,
			sql`
                SELECT id, date, is_available, start_time, end_time, note 
                FROM availability_overrides 
                WHERE profile_id = ${user.id} 
                  AND date >= CURRENT_DATE
                ORDER BY date ASC
            `,
			sql`
                SELECT has_lunch, lunch_start, lunch_end, full_name, username, avatar_url
                FROM public.profiles 
                WHERE id = ${user.id}
            `
		]);

		const profile = profileResult[0];

		return {
			user: {
				...user,
				has_lunch: profile.has_lunch,
				lunch_start: profile.lunch_start?.slice(0, 5) ?? '12:00',
				lunch_end: profile.lunch_end?.slice(0, 5) ?? '13:00'
			},
			workingHours: workingHours.map((wh) => ({
				...wh,
				start_time: wh.start_time?.slice(0, 5) ?? '09:00',
				end_time: wh.end_time?.slice(0, 5) ?? '18:00'
			})),
			overrides: overrides.map((ov) => ({
				...ov,
				date: ov.date instanceof Date ? ov.date.toISOString().split('T')[0] : ov.date,
				start_time: ov.start_time?.slice(0, 5) ?? null,
				end_time: ov.end_time?.slice(0, 5) ?? null
			}))
		};
	} catch (err) {
		console.error('Erro ao carregar horários:', err);
		throw error(500, 'Erro ao carregar agenda.');
	}
};

export const actions: Actions = {
	updateWorkingDay: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const daysToUpdate = [];
		let i = 0;

		while (formData.has(`days[${i}][id]`)) {
			daysToUpdate.push({
				id: formData.get(`days[${i}][id]`)?.toString(),
				start_time: formData.get(`days[${i}][start_time]`)?.toString() || '09:00',
				end_time: formData.get(`days[${i}][end_time]`)?.toString() || '18:00',
				is_active: formData.get(`days[${i}][is_active]`) === '1'
			});
			i++;
		}

		if (daysToUpdate.length === 0) return fail(400, { message: 'Nenhum dado enviado.' });

		try {
			await sql.begin(async (sql) => {
				for (const day of daysToUpdate) {
					await sql`
                        UPDATE working_hours 
                        SET 
                            start_time = ${day.start_time}, 
                            end_time = ${day.end_time}, 
                            is_active = ${day.is_active}
                        WHERE id = ${day.id} AND profile_id = ${user.id}
                    `;
				}

				// 🔄 Invalida e limpa slots futuros livres para regerar
				await sql`
                    DELETE FROM public.generated_slots 
                    WHERE profile_id = ${user.id} 
                      AND slot_date >= CURRENT_DATE 
                      AND is_booked = false
                `;
				// ⚡ Regera a esteira estática de 90 dias
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
			});

			return { success: true };
		} catch (err: any) {
			if (err.code === '23514') {
				return fail(400, { message: 'Um dos horários de término é inválido.' });
			}
			return fail(500, { message: 'Erro interno ao atualizar horários.' });
		}
	},

	upsertOverride: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id')?.toString(); // Captura o ID do formulário
		const date = formData.get('date')?.toString();
		const is_available = formData.has('is_available');

		if (!date) return fail(400, { message: 'Data obrigatória.' });

		try {
			const start_time = formData.get('start_time')?.toString() || null;
			const end_time = formData.get('end_time')?.toString() || null;
			const note = formData.get('note')?.toString() || null;

			await sql.begin(async (sql) => {
				if (id) {
					// Se tem ID, atualiza o registro permitindo a troca de data,
					// mas garante que pertence ao usuário logado
					await sql`
						UPDATE availability_overrides 
						SET 
							date = ${date},
							is_available = ${is_available},
							start_time = ${start_time},
							end_time = ${end_time},
							note = ${note}
						WHERE id = ${id} AND profile_id = ${user.id}
					`;
				} else {
					// Se não tem ID, faz o fluxo padrão de segurança usando o ON CONFLICT
					const payload = { profile_id: user.id, date, is_available, start_time, end_time, note };
					await sql`
						INSERT INTO availability_overrides ${sql(payload)}
						ON CONFLICT (profile_id, date) 
						DO UPDATE SET
							is_available = EXCLUDED.is_available,
							start_time = EXCLUDED.start_time,
							end_time = EXCLUDED.end_time,
							note = EXCLUDED.note
					`;
				}

				// 🔄 Limpa slots livres futuros
				await sql`
					DELETE FROM public.generated_slots 
					WHERE profile_id = ${user.id} 
					  AND slot_date >= CURRENT_DATE 
					  AND is_booked = false
				`;

				// ⚡ Força o recálculo
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
			});

			return { success: true };
		} catch (err: any) {
			// Código 23505 é Unique Violation (caso mude a data para um dia que já possui outra exceção)
			if (err.code === '23505') {
				return fail(400, { message: 'Já existe uma exceção configurada para esta nova data.' });
			}
			if (err.code === '23514') {
				return fail(400, { message: 'Horário inválido: término deve ser após o início.' });
			}
			console.error(err);
			return fail(500, { message: 'Erro interno ao salvar exceção.' });
		}
	},

	deleteOverride: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		try {
			await sql.begin(async (sql) => {
				await sql`
                    DELETE FROM availability_overrides 
                    WHERE id = ${id} AND profile_id = ${user.id}
                `;

				// 🔄 Remove os slots calculados sob a antiga exceção
				await sql`
                    DELETE FROM public.generated_slots 
                    WHERE profile_id = ${user.id} 
                      AND slot_date >= CURRENT_DATE 
                      AND is_booked = false
                `;
				// ⚡ Regera voltando ao comportamento do working_hours padrão
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
			});

			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro interno ao remover exceção.' });
		}
	},

	updateLunchTime: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const has_lunch = formData.get('has_lunch') === 'true';
		const lunch_start = formData.get('lunch_start')?.toString() || null;
		const lunch_end = formData.get('lunch_end')?.toString() || null;

		try {
			await sql.begin(async (sql) => {
				await sql`
                    UPDATE public.profiles 
                    SET 
                        has_lunch = ${has_lunch},
                        lunch_start = ${lunch_start},
                        lunch_end = ${lunch_end}
                    WHERE id = ${user.id}
                `;

				// 🔄 Como mudou o bloco de almoço, remove todos os slots livres futuros
				await sql`
                    DELETE FROM public.generated_slots 
                    WHERE profile_id = ${user.id} 
                      AND slot_date >= CURRENT_DATE 
                      AND is_booked = false
                `;
				// ⚡ Aplica a nova matemática de almoço na geração dos próximos 90 dias
				await sql`SELECT public.refresh_profile_slots(${user.id}, 90)`;
			});

			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Erro interno ao atualizar horário de almoço.' });
		}
	}
};
