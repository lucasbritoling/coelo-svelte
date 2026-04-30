import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user, session } }) => {
	if (!user || !session) {
		throw redirect(303, '/login');
	}

	return {
		user,
		session
	};
};
