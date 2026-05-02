import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';
import { DATABASE_URL } from '$env/static/private';
import postgres from 'postgres';

const PUBLIC_ROUTES = new Set(['/login', '/signup']);
const PRIVATE_ROUTES = new Set(['/agenda', '/clientes', '/servicos', '/horarios']);

const SECURITY_HEADERS: [string, string][] = [
	['X-Frame-Options', 'DENY'],
	['X-Content-Type-Options', 'nosniff'],
	['Referrer-Policy', 'strict-origin-when-cross-origin'],
	['Cross-Origin-Resource-Policy', 'same-origin'],
	['X-XSS-Protection', '0'],
	['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()']
];

export const handle: Handle = async ({ event, resolve }) => {
	// ── 1. CONFIGURAÇÃO DO BANCO DE DADOS ────────────────────────────────────
	// Prioriza a string do Hyperdrive em produção, usa DATABASE_URL localmente.
	const connectionString = event.platform?.env?.HYPERDRIVE?.connectionString;

	const sql = postgres(connectionString, {
		prepare: false, // Obrigatório para compatibilidade com pooling (Hyperdrive/PgBouncer)
		max: 1, // Deixe o Hyperdrive gerenciar o pool; 1 conexão por worker é o ideal
		onnotice: () => {}
	});

	event.locals.sql = sql;

	try {
		// ── 2. SUPABASE CLIENT ───────────────────────────────────────────────────
		event.locals.supabase = createServerClient(
			PUBLIC_SUPABASE_URL,
			PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
			{
				cookies: {
					getAll: () => event.cookies.getAll(),
					setAll: (cookiesToSet) => {
						cookiesToSet.forEach(({ name, value, options }) => {
							event.cookies.set(name, value, {
								...options,
								path: '/',
								maxAge: 60 * 60 * 24 * 400
							});
						});
					}
				}
			}
		);

		// ── 3. AUTENTICAÇÃO ──────────────────────────────────────────────────────
		const isPrivate = PRIVATE_ROUTES.has(event.url.pathname);
		const isPublic = PUBLIC_ROUTES.has(event.url.pathname);

		if (isPrivate || isPublic) {
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

			if (!session && isPrivate) throw redirect(303, '/login');
			if (session && isPublic) throw redirect(303, '/agenda');
		}

		// ── 4. RESOLVE + SECURITY HEADERS ───────────────────────────────────────
		const response = await resolve(event, {
			filterSerializedResponseHeaders: (name) => name === 'content-range'
		});

		for (const [header, value] of SECURITY_HEADERS) {
			response.headers.set(header, value);
		}

		return response;
	} finally {
		// ── 5. FECHAMENTO OBRIGATÓRIO ──────────────────────────────────────────
		// Garante que a conexão com o Hyperdrive seja encerrada após o request,
		// devolvendo o slot para o pool global imediatamente.
		await sql.end();
	}
};
