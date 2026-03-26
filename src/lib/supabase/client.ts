import { createBrowserClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';

// No navegador, criamos uma única instância (Singleton)
// No servidor (SSR), o SvelteKit vai criar uma instância por requisição no hooks.server.ts
export const supabase = isBrowser()
	? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
	: (null as any);
