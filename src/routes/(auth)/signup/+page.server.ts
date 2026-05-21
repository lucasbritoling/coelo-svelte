import type { Actions, PageServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { signupSchema } from '$lib/schemas/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(signupSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, sql } }) => {
		const form = await superValidate(request, zod4(signupSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const {
			email,
			password,
			full_name,
			username,
			address_custom,
			first_service_name,
			first_service_duration,
			first_service_color
		} = form.data;

		// 1. Criar o usuário no Supabase Auth
		const { data: authData, error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name,
					username
				}
			}
		});

		if (authError || !authData.user) {
			return message(form, authError?.message || 'Erro ao criar conta de acesso.', {
				status: 400
			});
		}

		const userId = authData.user.id;

		// 2. Executar transação no banco de dados via Postgres.js
		try {
			await sql.begin(async (tx) => {
				// Cria o profile do profissional
				// Nota: se você tiver um trigger automático no supabase que cria o perfil,
				// aqui nós fazemos um UPDATE ou um UPSERT para garantir que salvamos o username e address.
				await tx`
					INSERT INTO public.profiles (id, full_name, username, address)
					VALUES (${userId}, ${full_name}, ${username}, ${address_custom || null})
					ON CONFLICT (id) DO UPDATE 
					SET full_name = EXCLUDED.full_name, username = EXCLUDED.username, address = EXCLUDED.address
				`;

				// Mapeia a cor hexadecimal do setup para as categorias aceitas no seu tipo USER-DEFINED do banco se necessário.
				// Se seu banco aceita HEX puro na coluna color, passamos direto.
				const colorMapping: Record<string, string> = {
					'#0a0a0a': 'black',
					'#6366f1': 'blue', // ajustando para o seu tipo USER-DEFINED (ex: 'blue'::service_color)
					'#10b981': 'green',
					'#f59e0b': 'amber',
					'#ef4444': 'red'
				};
				const dbColor = colorMapping[first_service_color] || 'blue';

				// Cria o primeiro serviço padrão
				await tx`
					INSERT INTO public.services (name, duration, profile_id, color, is_active)
					VALUES (${first_service_name}, ${first_service_duration}, ${userId}, ${dbColor}, true)
				`;

				// Opcional: Criar uma grade padrão de horários de trabalho (working_hours) de Seg a Sex (1 a 5) das 09:00 às 18:00
				const days = [1, 2, 3, 4, 5];
				for (const day of days) {
					await tx`
						INSERT INTO public.working_hours (profile_id, day_of_week, start_time, end_time, is_active)
						VALUES (${userId}, ${day}, '09:00:00', '18:00:00', true)
					`;
				}
			});
		} catch (dbError: any) {
			console.error('Erro na transação de onboarding:', dbError);

			// Se o banco falhar, idealmente remover o usuário do Auth para evitar inconsistência (opcional)
			// ou retornar erro amigável ao cliente.
			return message(
				form,
				'Sua conta foi criada, mas houve um problema ao configurar seu espaço. Acesse o painel para tentar novamente.',
				{
					status: 500
				}
			);
		}

		// Tudo pronto. Redireciona para a aplicação interna
		throw redirect(303, '/agenda');
	}
};
