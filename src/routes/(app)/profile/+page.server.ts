import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	updateAvatar: async ({ request, locals }) => {
		console.log('--- Action updateAvatar Iniciada ---');

		const session = await locals.session;
		if (!session) {
			console.error('Erro: Sessão não encontrada no servidor');
			return fail(401);
		}

		try {
			const formData = await request.formData();
			const file = formData.get('avatar') as File;

			console.log('Dados do arquivo recebido:', {
				name: file?.name,
				type: file?.type,
				size: `${(file?.size / 1024).toFixed(2)} KB`
			});

			if (!file || file.size === 0) {
				console.warn('Aviso: Arquivo vazio ou não enviado');
				return fail(400);
			}

			const fileExt = file.name.split('.').pop();
			const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
			const filePath = `${fileName}`; // Verifique se o bucket exige pasta ou caminho raiz

			// 1. Upload para o Storage
			const { data: uploadData, error: storageError } = await locals.supabase.storage
				.from('avatars')
				.upload(filePath, file, { upsert: true });

			if (storageError) {
				console.error('Erro no Supabase Storage:', storageError);
				return fail(500, { message: storageError.message });
			}

			console.log('Upload realizado com sucesso:', uploadData);

			// 2. URL Pública
			const {
				data: { publicUrl }
			} = locals.supabase.storage.from('avatars').getPublicUrl(filePath);

			// 3. Update Auth Metadata
			const { error: authError } = await locals.supabase.auth.updateUser({
				data: { avatar_url: publicUrl }
			});

			if (authError) {
				console.error('Erro ao atualizar metadata do Auth:', authError);
				return fail(500);
			}

			console.log('Metadata atualizado com URL:', publicUrl);
			return { success: true, avatarUrl: publicUrl };
		} catch (err) {
			console.error('Erro inesperado na Action:', err);
			return fail(500);
		}
	}
};
