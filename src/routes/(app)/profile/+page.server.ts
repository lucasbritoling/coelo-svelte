import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	updateAvatar: async ({ request, locals }) => {
		const session = await locals.session;
		if (!session) {
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
				return fail(500, { message: 'Erro interno ao salvar no banco de dados.' });
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
				} else {
				}
			}

			// 7. GERAÇÃO DA URL PÚBLICA PARA RESPOSTA
			const {
				data: { publicUrl }
			} = locals.supabase.storage.from('avatars').getPublicUrl(filePath);

			return { success: true, avatarUrl: publicUrl };
		} catch (err) {
			return fail(500);
		}
	},
	updateProfile: async ({ request, locals }) => {
		const session = await locals.session;
		if (!session) return fail(401);

		const formData = await request.formData();
		const fullName = formData.get('fullName')?.toString().trim();
		const username = formData.get('username')?.toString().trim().toLowerCase();
		const address = formData.get('address')?.toString().trim();
		const phone = formData.get('phone')?.toString().trim();
		const email = formData.get('email')?.toString().trim();
		const password = formData.get('password')?.toString();

		// Validações Básicas Obrigatórias
		if (!fullName || !username) {
			return fail(400, { message: 'Nome e Link da agenda são obrigatórios.' });
		}

		// Regex simples para evitar caracteres estranhos no link da agenda
		if (!/^[a-z0-9-_]+$/.test(username)) {
			return fail(400, {
				message: 'O link da agenda deve conter apenas letras, números, hífens ou underlines.'
			});
		}

		try {
			// 1. Verificar se o username já está em uso por outro usuário
			const existingUser = await locals.sql`
				SELECT id FROM public.profiles 
				WHERE username = ${username} AND id != ${session.user.id}
			`;
			if (existingUser.length > 0) {
				return fail(400, { message: 'Este link de agenda já está sendo utilizado.' });
			}

			// 2. Atualizar dados na tabela pública public.profiles
			// Se o campo de telefone não existir na tabela, remova a linha correspondente
			await locals.sql`
				UPDATE public.profiles
				SET 
					full_name = ${fullName},
					username = ${username},
					address = ${address || null}
				WHERE id = ${session.user.id}
			`;

			// 3. Atualizar metadados de exibição no Auth do Supabase
			const authAttributes: any = {
				data: { full_name: fullName, username: username }
			};

			// Se o usuário preencheu um novo e-mail e ele é diferente do atual
			if (email && email !== session.user.email) {
				authAttributes.email = email;
			}

			// Se o usuário digitou uma nova senha
			if (password && password.length > 0) {
				if (password.length < 6) {
					return fail(400, { message: 'A nova senha deve ter no mínimo 6 caracteres.' });
				}
				authAttributes.password = password;
			}

			// 4. Executa a atualização no Supabase Auth se houver e-mail, senha ou metadados novos
			const { error: authError } = await locals.supabase.auth.updateUser(authAttributes);

			if (authError) {
				return fail(400, { message: authError.message });
			}

			return { success: true };
		} catch (err) {
			console.error('Erro ao atualizar perfil:', err);
			return fail(500, { message: 'Erro interno ao salvar os dados.' });
		}
	}
};
