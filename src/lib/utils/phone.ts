/**
 * Limpa qualquer caractere não numérico e limita a string a 11 dígitos.
 */
export function sanitizePhone(value: string): string {
    return value.replace(/\D/g, '').slice(0, 11);
}

/**
 * Aplica a máscara (XX) XXXXX-XXXX em tempo real de acordo com o tamanho da string limpa.
 */
export function formatPhoneMask(value: string): string {
    const clean = value.replace(/\D/g, ''); // Garante que opera em dados limpos
    if (!clean) return '';
    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

/**
 * Valida se o telefone cumpre estritamente os 11 dígitos exigidos (DDD + 9 dígitos).
 */
export function isValidPhone(value: string): boolean {
    return value.length === 11;
}