import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Isso diz ao Vitest para procurar arquivos .test.ts em qualquer lugar na pasta src
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
