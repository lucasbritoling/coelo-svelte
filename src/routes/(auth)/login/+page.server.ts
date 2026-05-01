import { fail, redirect } from '@sveltejs/kit';
import { loginSchema } from '$lib/schemas/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Se o usuário já estiver logado, manda pra agenda (opcional, mas bom)
	if (locals.session) throw redirect(303, '/agenda');

	return {
		// Captura o parâmetro 'message' da URL
		successMessage: url.searchParams.get('message')
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = Object.fromEntries(await request.formData());
		const result = loginSchema.safeParse(formData);

		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				email: formData.email as string
			});
		}

		const { email, password } = result.data;
		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, {
				message: 'E-mail ou senha incorretos',
				email
			});
		}

		throw redirect(303, '/agenda');
	}
};
