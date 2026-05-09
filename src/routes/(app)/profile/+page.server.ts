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

			// Geramos um nome único para o arquivo
			const fileExt = file.name.split('.').pop();
			const filePath = `${session.user.id}-${Date.now()}.${fileExt}`;

			// 1. Upload para o Storage (Bucket 'avatars')
			const { error: storageError } = await locals.supabase.storage
				.from('avatars')
				.upload(filePath, file, { upsert: true });

			if (storageError) {
				console.error('Erro no Supabase Storage:', storageError);
				return fail(500, { message: storageError.message });
			}

			// 2. ATUALIZAÇÃO DA TABELA PÚBLICA (Para a página de agendamento)
			// Usamos o seu locals.sql (Postgres/Hyperdrive)
			try {
				await locals.sql`
                    UPDATE public.profiles 
                    SET avatar_url = ${filePath} 
                    WHERE id = ${session.user.id}
                `;
				console.log('Tabela public.profiles atualizada com o path:', filePath);
			} catch (dbError) {
				console.error('Erro ao atualizar tabela profiles:', dbError);
				return fail(500, { message: 'Erro ao salvar no banco de dados.' });
			}

			// 3. UPDATE AUTH METADATA (Para a área logada interna)
			// Dica: salve o filePath aqui também para manter o padrão
			const { error: authError } = await locals.supabase.auth.updateUser({
				data: { avatar_url: filePath }
			});

			if (authError) {
				console.error('Erro ao atualizar metadata do Auth:', authError);
				// Não falhamos aqui pois o banco principal já foi atualizado
			}

			// 4. GERAÇÃO DA URL PÚBLICA PARA RESPOSTA IMEDIATA NA UI
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
