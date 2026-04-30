// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) {
		throw redirect(303, '/agenda');
	}

	throw redirect(303, '/login');
};
