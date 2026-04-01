import type { Actions, PageServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { forgotPasswordSchema } from '$lib/schemas/auth';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(forgotPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email } = form.data;

		// O Supabase enviará um e-mail com um link de retorno
		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/callback?next=/confirm-reset`
		});

		if (error) {
			return message(form, error.message, { status: 400 });
		}

		return message(form, 'Link de redefinição enviado! Verifique sua caixa de entrada.');
	}
};
