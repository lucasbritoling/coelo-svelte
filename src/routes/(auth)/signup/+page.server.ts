import type { Actions } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { signupSchema } from '$lib/schemas/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(signupSchema));

	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(signupSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password, full_name, username } = form.data;

		const { error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name, // Salva no campo raw_user_meta_data do Supabase
					username
				}
			}
		});

		if (error) {
			return message(form, error.message, {
				status: 400
			});
		}

		throw redirect(303, '/agenda');
	}
};
