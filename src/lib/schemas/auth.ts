import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email('E-mail inválido'),
	password: z.string().min(6, 'Muito curto')
});

export const forgotPasswordSchema = z.object({
	email: z.email('E-mail inválido')
});

export const resetPasswordSchema = z
	.object({
		password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'As senhas não coincidem',
		path: ['confirmPassword']
	});

// Lista de nomes reservados para evitar conflitos com rotas do sistema e personificação [1, 2, 3]
const RESERVED_USERNAMES = new Set([
	'admin',
	'superadmin',
	'administrator',
	'api',
	'app',
	'auth',
	'blog',
	'cache',
	'careers',
	'cart',
	'checkout',
	'contact',
	'dashboard',
	'dev',
	'download',
	'email',
	'faq',
	'help',
	'info',
	'legal',
	'login',
	'termos',
	'condicoes',
	'signup',
	'agenda',
	'logout',
	'mail',
	'news',
	'order',
	'payment',
	'pricing',
	'privacy',
	'profile',
	'root',
	'search',
	'settings',
	'configuracoes',
	'shop',
	'status',
	'support',
	'policy',
	'terms',
	'webmaster',
	'www',
	'services',
	'service',
	'customers',
	'customer',
	'cliente',
	'clientes',
	'serviço',
	'serviços',
	'agendas',
	'forgot'
]);

export const usernameSchema = z
	.string()
	.max(30, 'Muito longo') // Limite inicial para segurança de buffer e SEO [4, 5]
	.transform(
		(val) =>
			val
				.trim()
				.toLowerCase()
				.normalize('NFD') // Decompõe caracteres acentuados (ex: 'á' vira 'a' + '´') [6, 7]
				.replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos resultantes [8, 9]
				.replace(/[æ]/g, 'ae') // Tratamento manual de ligaduras que a normalização NFD não resolve [6, 10]
				.replace(/[œ]/g, 'oe')
				.replace(/\s+/g, '-') // Substitui espaços por hifens para legibilidade de URL [11, 4]
				.replace(/[^a-z0-9-]/g, '') // Remove caracteres especiais não permitidos em slugs [12, 13]
				.replace(/-+/g, '-') // Evita hifens duplicados (ex: --) [8, 14]
				.replace(/^-|-$/g, '') // Remove hifens órfãos no início ou fim [15, 12]
	)
	.pipe(
		z
			.string()
			.min(3, 'Muito curto')
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Formato inválido') // Valida a estrutura final do slug [16]
			.refine((val) => !RESERVED_USERNAMES.has(val), {
				message: 'Link já reservado.' // Previne sequestro de rotas críticas [17, 18]
			})
	);

export const signupSchema = z
	.object({
		full_name: z.string().min(3, 'Muito curto'),
		email: z.email('E-mail inválido'),
		password: z.string().min(6, 'Muito curto'),
		confirmPassword: z.string(),
		username: usernameSchema
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'As senhas não coincidem',
		path: ['confirmPassword']
	});
