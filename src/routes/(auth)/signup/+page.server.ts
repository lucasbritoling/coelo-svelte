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
	default: async ({ request, locals: { supabase } }) => {
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

		// Mapeamento de cor (ajuste conforme necessário)
		const colorMapping: Record<string, string> = {
			'#0a0a0a': 'zinc',
			'#6366f1': 'indigo',
			'#10b981': 'emerald',
			'#f59e0b': 'amber',
			'#ef4444': 'rose'
		};
		const dbColor = colorMapping[first_service_color] || 'blue';

		// 1. Criar o usuário
		// Os dados do onboarding seguem no `data` (metadata),
		// que a trigger usará para processar o onboarding.
		const { error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name,
					username,
					address_custom,
					first_service_name,
					first_service_duration,
					first_service_color: dbColor
				}
			}
		});

		// Se houver erro, a trigger no banco já terá revertido o INSERT (Rollback),
		// ou o Supabase Auth falhará o cadastro e retornará o erro aqui.
		if (authError) {
			console.error('🔍 [SERVER] Erro no signUp:', authError);
			return message(form, authError.message, { status: 400 });
		}

		console.log('🔍 [SERVER] Usuário criado e onboarding disparado via trigger.');

		throw redirect(303, '/agenda');
	}
};
