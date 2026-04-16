import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
  workbox: {
                // 1. Força o cache de todos os arquivos gerados e da pasta static
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
                
                // 2. Garante que o app funcione como Single Page App (SPA) offline
                navigateFallback: '/',
                
                // 3. Limpa caches de versões antigas automaticamente
                cleanupOutdatedCaches: true,

                // 4. Faz o Service Worker assumir o controle do app na hora
                skipWaiting: true,
                clientsClaim: true
            },
			manifest: {
				name: 'Coelo',
				short_name: 'Coelo',
				display: 'standalone',
				start_url: '/',
				id: '/',
				scope: '/',
				description: 'Link de autoagendamento. Rápido. Simples.',
				theme_color: '#191919',
				background_color: '#191919',
				icons: [
					{
						src: 'favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: 'icon-512-rounded.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any' // Desktop e Splash Screens (usa a transparência nativa)
					},
					{
						src: 'icon-512-squared.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable' // Android (permite ao sistema cortar em círculo, gota ou quadrado)
					}
				]
			}
		})
	]
});
