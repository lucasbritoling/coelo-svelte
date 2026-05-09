// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Sql } from 'postgres'; // Importe o tipo Sql aqui

declare global {
	namespace App {
		interface Platform {
			env: {
				HYPERDRIVE: {
					connectionString: string;
				};
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
			sql: Sql;
			user: {
				id: string;
				email: string | undefined;
				full_name: string;
				username: string;
				avatar_url: string;
			} | null;
		}
		interface PageData {
			session: Session | null;
		}
		// interface Error {}
		// interface PageState {}
	}
}

export {};
