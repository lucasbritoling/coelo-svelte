import type { Actions, PageServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { resetPasswordSchema } from '$lib/schemas/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	// 1. Se não há sessão, o usuário não tem permissão para estar aqui.
	// O link do e-mail passou pelo /callback, que gerou a sessão.
	if (!session) {
		throw redirect(303, '/auth/forgot?message=Link expirado ou inválido.');
	}

	const form = await superValidate(zod4(resetPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, session } }) => {
		// 2. Proteção extra na Action
		if (!session) return fail(401, { message: 'Sessão expirada. Tente novamente.' });

		const form = await superValidate(request, zod4(resetPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// 3. Atualiza a senha
		const { error } = await supabase.auth.updateUser({
			password: form.data.password
		});

		if (error) {
			return message(form, error.message, { status: 400 });
		}

		// 4. Logout forçado (Boa prática)
		// Isso invalida a sessão de reset e garante que ele logue com a nova senha.
		await supabase.auth.signOut();

		throw redirect(303, '/login?message=Senha atualizada com sucesso. Faça login agora.');
	}
};
