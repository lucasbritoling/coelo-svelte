import { describe, it, expect } from 'vitest';
import { loginSchema } from './auth';

describe('Login Schema', () => {
	it('deve validar um email e senha corretos', () => {
		const data = { email: 'teste@exemplo.com', password: 'password123' };
		const result = loginSchema.safeParse(data);

		expect(result.success).toBe(true);
	});

	it('deve falhar se o email for inválido', () => {
		const data = { email: 'email-invalido', password: 'password123' };
		const result = loginSchema.safeParse(data);

		expect(result.success).toBe(false);
		if (!result.success) {
			// Verifica se a mensagem de erro é a que o Zod gera por padrão
			expect(result.error.flatten().fieldErrors.email).toBeDefined();
		}
	});

	it('deve falhar se a senha for muito curta', () => {
		const data = { email: 'teste@exemplo.com', password: '123' };
		const result = loginSchema.safeParse(data);

		expect(result.success).toBe(false);
	});
});
