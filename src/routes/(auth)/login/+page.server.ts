import { fail, redirect } from '@sveltejs/kit';
import { loginSchema } from '$lib/schemas/auth';
import type { Actions } from './$types';

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
