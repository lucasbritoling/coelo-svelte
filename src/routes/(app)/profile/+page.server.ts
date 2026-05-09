import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	updateAvatar: async ({ request, locals }) => {
		const session = await locals.session;
		if (!session) return fail(401);

		const formData = await request.formData();
		const file = formData.get('avatar') as File;

		if (!file || file.size === 0) return fail(400);

		const fileExt = file.name.split('.').pop();
		const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
		const filePath = `avatars/${fileName}`;

		// 1. Upload para o Supabase Storage
		const { error: storageError } = await locals.supabase.storage
			.from('avatars')
			.upload(filePath, file);

		if (storageError) return fail(500, { message: 'Erro no Storage' });

		// 2. Pegar URL Pública
		const {
			data: { publicUrl }
		} = locals.supabase.storage.from('avatars').getPublicUrl(filePath);

		// 3. Update no Banco de Dados (Latência reduzida via Hyperdrive)
		await locals.sql`
            UPDATE profiles 
            SET avatar_url = ${publicUrl} 
            WHERE id = ${session.user.id}
        `;

		// 4. Update no User Metadata (Para o hook pegar sem consulta extra)
		const { error: authError } = await locals.supabase.auth.updateUser({
			data: { avatar_url: publicUrl }
		});

		if (authError) return fail(500, { message: 'Erro ao sincronizar sessão' });

		return { success: true, avatarUrl: publicUrl };
	}
};
