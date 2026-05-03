import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';
import postgres from 'postgres';

const PUBLIC_ROUTES = new Set(['/login', '/signup']);
const PRIVATE_ROUTES = new Set(['/agenda', '/clientes', '/servicos', '/horarios']);

/**
 * 1. HOOK DE CONECTIVIDADE (BANCO DE DADOS)
 * Focado em Lazy Loading e limpeza não-bloqueante.
 */
const databaseHandle: Handle = async ({ event, resolve }) => {
	let sqlInstance: postgres.Sql | undefined;

	// Criamos o Proxy a partir de uma função anônima para que seja "chamável"
	event.locals.sql = new Proxy((() => {}) as unknown as postgres.Sql, {
		// Captura chamadas como: sql`SELECT...`
		apply(_target, _thisArg, argArray) {
			if (!sqlInstance) {
				const connectionString = event.platform?.env.HYPERDRIVE.connectionString;
				if (!connectionString) throw new Error('Hyperdrive binding não encontrado.');

				sqlInstance = postgres(connectionString, {
					prepare: true,
					fetch_types: false,
					max: 1,
					idle_timeout: 0.1,
					connect_timeout: 10
				});
			}
			return (sqlInstance as any)(...argArray);
		},
		// Captura acessos a propriedades como: sql.unsafe ou sql.begin
		get(_target, prop) {
			if (!sqlInstance) {
				const connectionString = event.platform?.env.HYPERDRIVE.connectionString;
				if (!connectionString) throw new Error('Hyperdrive binding não encontrado.');

				sqlInstance = postgres(connectionString, {
					prepare: true,
					fetch_types: false,
					max: 1,
					idle_timeout: 0.1,
					connect_timeout: 10
				});
			}
			return Reflect.get(sqlInstance, prop);
		}
	});

	const response = await resolve(event);

	// PERFORMANCE: Limpeza assíncrona que não bloqueia a resposta ao usuário [1, 2]
	if (sqlInstance && event.platform?.ctx?.waitUntil) {
		event.platform.ctx.waitUntil(sqlInstance.end());
	}

	return response;
};

/**
 * 2. HOOK DE AUTENTICAÇÃO (SUPABASE)
 */
const authHandle: Handle = async ({ event, resolve }) => {
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

	// 1. SEMPRE tenta obter a sessão (necessário para o /logout funcionar)
	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();
	event.locals.session = session;
	event.locals.user = session?.user
		? {
				id: session.user.id,
				email: session.user.email ?? '',
				full_name: session.user.user_metadata?.full_name ?? 'Usuário'
			}
		: null;

	// 2. Lógica de proteção de rotas (Redirecionamentos)
	const isPrivate = PRIVATE_ROUTES.has(event.url.pathname);
	const isPublic = PUBLIC_ROUTES.has(event.url.pathname);

	if (!session && isPrivate) throw redirect(303, '/login');
	if (session && isPublic) throw redirect(303, '/agenda');

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

/**
 * 3. HOOK DE SEGURANÇA
 */
const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	const headers = {
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Cross-Origin-Resource-Policy': 'same-origin',
		'X-XSS-Protection': '0',
		'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
	};

	Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
	return response;
};

// Ordem de execução: Banco -> Auth -> Segurança
export const handle = sequence(databaseHandle, authHandle, securityHandle);
