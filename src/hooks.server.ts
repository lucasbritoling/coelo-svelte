import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';

const PUBLIC_ROUTES = new Set(['/login', '/signup']);
const PRIVATE_ROUTES = new Set(['/agenda', '/clientes', '/servicos']);

export const handle: Handle = async ({ event, resolve }) => {
	// instanciação única (singleton) do objeto de conexão com o supabase
	// guardado no baúzinho 'locals', que sobrevive durante todo o ciclo
	// de vida da requisição. é capaz de ler e setar cookies e é restrito pela
	// RLS. seus cookies são válidos para todas as rotas do app.

	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	// middleware verifica se há cookies de sessão válidos no cliente, sem fazer chamada
	// de rede ao supabase. caso hajam cookies, não faz nada a não ser redirecionar
	// à agenda caso o cliente esteja na página de login ou cadastro. caso não
	// existam cookies válidos expulsa o cliente para o login.

	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	event.locals.session = session;
	event.locals.user = session?.user ?? null;

	if (!session && PRIVATE_ROUTES.has(event.url.pathname)) {
		throw redirect(303, '/login');
	}

	if (session && PUBLIC_ROUTES.has(event.url.pathname)) {
		throw redirect(303, '/agenda');
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};
