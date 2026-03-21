import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {

	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// 2. Helper Atômico para Sessão Segura
	event.locals.safeGetSession = async () => {
		const { data: { session } } = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };
		
		// getUser() valida o JWT no servidor do Supabase (Segurança máxima)
		const { data: { user }, error } = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };
		
		return { session, user };
	};

	const { user } = await event.locals.safeGetSession();

	// 3. Lógica de Roteamento (O seu antigo Proxy)
	const pathname = event.url.pathname;
	const isAuthPage = pathname.startsWith('/auth');
	// Adicione aqui as rotas que exigem login
	const isProtectedRoute = ['/agenda', '/customers', '/settings'].some(p => pathname.startsWith(p));

	if (isProtectedRoute && !user) {
		const next = pathname !== '/' ? `?next=${pathname}` : '';
		throw redirect(303, `/auth/login${next}`);
	}

	if (isAuthPage && user) {
		throw redirect(303, '/agenda');
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};