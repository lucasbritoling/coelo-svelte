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

			if (!file || file.size === 0) {
				console.warn('Aviso: Arquivo vazio ou não enviado');
				return fail(400);
			}

			// 1. BUSCAR O CAMINHO DO ARQUIVO ANTIGO
			// Consultamos o banco antes da atualização para saber o que deletar
			const currentProfile = await locals.sql`
                SELECT avatar_url FROM public.profiles 
                WHERE id = ${session.user.id}
            `;
			const oldFilePath = currentProfile[0]?.avatar_url;

			// 2. PREPARAR NOVO ARQUIVO
			const fileExt = file.name.split('.').pop();
			const filePath = `${session.user.id}-${Date.now()}.${fileExt}`;

			// 3. UPLOAD DO NOVO ARQUIVO
			const { error: storageError } = await locals.supabase.storage
				.from('avatars')
				.upload(filePath, file, { upsert: true });

			if (storageError) {
				console.error('Erro no Supabase Storage:', storageError);
				return fail(500, { message: storageError.message });
			}

			// 4. ATUALIZAÇÃO DA TABELA PÚBLICA
			try {
				await locals.sql`
                    UPDATE public.profiles 
                    SET avatar_url = ${filePath} 
                    WHERE id = ${session.user.id}
                `;
			} catch (dbError) {
				console.error('Erro ao atualizar tabela profiles:', dbError);
				return fail(500, { message: 'Erro ao salvar no banco de dados.' });
			}

			// 5. UPDATE AUTH METADATA
			await locals.supabase.auth.updateUser({
				data: { avatar_url: filePath }
			});

			// 6. LIMPEZA: EXCLUSÃO DO ARQUIVO ANTIGO
			// Só tentamos deletar se existia um arquivo anterior e se ele é diferente do novo
			if (oldFilePath && oldFilePath !== filePath) {
				const { error: deleteError } = await locals.supabase.storage
					.from('avatars')
					.remove([oldFilePath]);

				if (deleteError) {
					// Logamos o erro mas não interrompemos o sucesso,
					// pois o novo upload já foi concluído com êxito.
					console.warn('Aviso: Não foi possível remover o arquivo antigo:', deleteError.message);
				} else {
					console.log('Arquivo antigo removido com sucesso:', oldFilePath);
				}
			}

			// 7. GERAÇÃO DA URL PÚBLICA PARA RESPOSTA
			const {
				data: { publicUrl }
			} = locals.supabase.storage.from('avatars').getPublicUrl(filePath);

			console.log('Processo concluído com sucesso.');
			return { success: true, avatarUrl: publicUrl };
		} catch (err) {
			console.error('Erro inesperado na Action:', err);
			return fail(500);
		}
	}
};
