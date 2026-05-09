import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		serviceWorker: { register: false },
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'strict-dynamic'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https://ftuqhtdwptawwbctpfgh.supabase.co'],
				'font-src': ['self'],
				'connect-src': ['self', 'https://ftuqhtdwptawwbctpfgh.supabase.co'],
				'object-src': ['none'],
				'base-uri': ['none'],
				'form-action': ['self'],
				'frame-ancestors': ['none'],
				'upgrade-insecure-requests': true,
				'block-all-mixed-content': true
			}
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
