import type { Actions, PageServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { resetPasswordSchema } from '$lib/schemas/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	const code = url.searchParams.get('code');

	if (code) {
		// Troca o código da URL por uma sessão real
		await locals.supabase.auth.exchangeCodeForSession(code);
	}

	const form = await superValidate(zod4(resetPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// No Supabase, atualizar a senha de quem está com a sessão de reset ativa
		const { error } = await locals.supabase.auth.updateUser({
			password: form.data.password
		});

		if (error) {
			return message(form, error.message, { status: 400 });
		}

		// Senha alterada! Agora mandamos ele para o login ou dashboard
		throw redirect(303, '/login?message=Senha atualizada com sucesso');
	}
};
