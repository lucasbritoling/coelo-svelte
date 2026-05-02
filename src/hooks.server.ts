import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';
import postgres from 'postgres';

let sql: ReturnType<typeof postgres>;

const PUBLIC_ROUTES = new Set(['/login', '/signup']);
const PRIVATE_ROUTES = new Set(['/agenda', '/clientes', '/servicos', '/horarios']);

export const handle: Handle = async ({ event, resolve }) => {
	// --- INICIALIZAÇÃO DO POSTGRES (HYPERDRIVE) ---
	// Tentamos pegar a string do Hyperdrive, com fallback para DATABASE_URL
	const connectionString =
		event.platform?.env.HYPERDRIVE?.connectionString || event.platform?.env.DATABASE_URL;

	if (!sql && connectionString) {
		try {
			sql = postgres(connectionString, {
				prepare: false, // Obrigatório para Hyperdrive/PgBouncer
				max: 1, // No Edge, o ideal é 1 conexão por instância do Worker
				idle_timeout: 20,
				connect_timeout: 10
			});
		} catch (err) {
			console.error('Erro ao conectar ao Postgres:', err);
		}
	}

	// Disponibilizamos o sql no locals para as rotas (+page.server.ts)
	event.locals.sql = sql;

	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/', maxAge: 60 * 60 * 24 * 400 });
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

	if (session?.user) {
		event.locals.user = {
			id: session.user.id,
			email: session.user.email,
			full_name: session.user.user_metadata?.full_name ?? 'Usuário'
		};
	} else {
		event.locals.user = null;
	}

	if (!session && PRIVATE_ROUTES.has(event.url.pathname)) {
		throw redirect(303, '/login');
	}

	if (session && PUBLIC_ROUTES.has(event.url.pathname)) {
		throw redirect(303, '/agenda');
	}

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});

	// Agora que temos a 'response' na mão, injetamos os cabeçalhos:
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
	response.headers.set('X-XSS-Protection', '0');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()'
	);

	// E finalmente retornamos a resposta modificada
	return response;
};
