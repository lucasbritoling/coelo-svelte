import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { sql, user } }) => {
	// Proteção de rota idêntica ao restante do app
	if (!user) throw redirect(303, '/login');

	try {
		// Busca apenas os dados necessários do profile do usuário logado
		const [profile] = await sql`
			SELECT favorite_ghost_slot_interval
			FROM public.profiles
			WHERE id = ${user.id}
		`;

		if (!profile) {
			throw redirect(303, '/login');
		}

		return { profile };
	} catch (error) {
		console.error('Erro ao carregar dados do perfil:', error);
		return { profile: { favorite_ghost_slot_interval: 30 } }; // Fallback seguro
	}
};

export const actions: Actions = {
	updateInterval: async ({ request, locals: { sql, user } }) => {
		if (!user) return fail(401);

		const formData = await request.formData();
		const interval = parseInt(formData.get('favorite_ghost_slot_interval')?.toString() || '', 10);

		// Valida se é um número válido e evita valores absurdos ou negativos (max 1440 min = 24h)
		if (isNaN(interval) || interval < 1 || interval > 1440) {
			return fail(400, { message: 'Insira um intervalo válido entre 1 e 1440 minutos.' });
		}

		try {
			await sql`
				UPDATE public.profiles
				SET favorite_ghost_slot_interval = ${interval}
				WHERE id = ${user.id}
			`;

			return { success: true };
		} catch (error) {
			console.error('Erro ao atualizar intervalo padrão:', error);
			return fail(500, { message: 'Erro interno ao salvar configuração.' });
		}
	}
};
