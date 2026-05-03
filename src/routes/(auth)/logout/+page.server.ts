import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ locals: { supabase } }) => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (session) {
			await supabase.auth.signOut();
		}
		throw redirect(303, '/login');
	}
};
