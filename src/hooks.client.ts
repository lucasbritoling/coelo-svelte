import { building } from '$app/environment';

if (!building) {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	// Cria o cookie de fuso com validade de 1 ano
	document.cookie = `timezone=${tz}; path=/; max-age=31536000; SameSite=Lax`;
}
