import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.session;

	// Proteção de rota simples
	if (!session) {
		throw redirect(303, '/login');
	}

	try {
		// Busca os dados direto pelo Postgres.js para performance máxima
		const rows = await locals.sql`
			SELECT full_name, username, avatar_url, address
			FROM public.profiles 
			WHERE id = ${session.user.id}
		`;

		const profile = rows[0];
		if (!profile) {
			throw error(404, 'Perfil não encontrado no sistema.');
		}

		// Resolve a URL pública do avatar caso exista um path salvo
		let fullAvatarUrl = '';
		if (profile.avatar_url) {
			if (profile.avatar_url.startsWith('http')) {
				fullAvatarUrl = profile.avatar_url;
			} else {
				const { data } = locals.supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
				fullAvatarUrl = data?.publicUrl || '';
			}
		}

		return {
			user: {
				full_name: profile.full_name,
				username: profile.username,
				address: profile.address || '',
				// E-mail e Telefone principais vêm direto do objeto seguro de Auth do Supabase
				email: session.user.email || '',
				phone: session.user.phone || '',
				avatar_url: fullAvatarUrl
			}
		};
	} catch (err) {
		console.error('Erro ao carregar dados do perfil:', err);
		throw error(500, 'Erro interno ao carregar o perfil.');
	}
};

export const actions: Actions = {
	updateAvatar: async ({ request, locals }) => {
		const session = await locals.session;
		if (!session) return fail(401);

		try {
			const formData = await request.formData();
			const file = formData.get('avatar') as File;

			if (!file || file.size === 0) {
				return fail(400);
			}

			const currentProfile = await locals.sql`
				SELECT avatar_url FROM public.profiles  
				WHERE id = ${session.user.id}
			`;
			const oldFilePath = currentProfile[0]?.avatar_url;

			const fileExt = file.name.split('.').pop();
			const filePath = `${session.user.id}-${Date.now()}.${fileExt}`;

			const { error: storageError } = await locals.supabase.storage
				.from('avatars')
				.upload(filePath, file, { upsert: true });

			if (storageError) {
				return fail(500, { message: storageError.message });
			}

			await locals.sql`
				UPDATE public.profiles 
				SET avatar_url = ${filePath} 
				WHERE id = ${session.user.id}
			`;

			await locals.supabase.auth.updateUser({
				data: { avatar_url: filePath }
			});

			if (oldFilePath && oldFilePath !== filePath && !oldFilePath.startsWith('http')) {
				await locals.supabase.storage.from('avatars').remove([oldFilePath]);
			}

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

		if (!fullName || !username) {
			return fail(400, { message: 'Nome e Link da agenda são obrigatórios.' });
		}

		let emailChanged = false;

		if (!/^[a-z0-9-_]+$/.test(username)) {
			return fail(400, {
				message: 'O link da agenda deve conter apenas letras, números, hífens ou underlines.'
			});
		}

		try {
			const existingUser = await locals.sql`
			SELECT id FROM public.profiles 
			WHERE username = ${username} AND id != ${session.user.id}
		`;
			if (existingUser.length > 0) {
				return fail(400, { message: 'Este link de agenda já está sendo utilizado.' });
			}

			await locals.sql`
			UPDATE public.profiles
			SET 
				full_name = ${fullName},
				username = ${username},
				address = ${address || null}
			WHERE id = ${session.user.id}
		`;

			const authAttributes: any = {
				data: { full_name: fullName, username: username }
			};

			if (email && email !== session.user.email) {
				authAttributes.email = email;
				emailChanged = true;
			}

			if (phone && phone !== session.user.phone) {
				authAttributes.phone = phone;
			}

			if (password && password.length > 0) {
				if (password.length < 6) {
					return fail(400, { message: 'A nova senha deve ter no mínimo 6 caracteres.' });
				}
				authAttributes.password = password;
			}

			const { error: authError } = await locals.supabase.auth.updateUser(authAttributes);

			if (authError) {
				return fail(400, { message: authError.message });
			}

			return { success: true, emailChanged };
		} catch (err) {
			console.error('Erro ao atualizar perfil:', err);
			return fail(500, { message: 'Erro interno ao salvar os dados.' });
		}
	}
};
