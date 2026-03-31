import { z } from 'zod';

export const customerSchema = z.object({
	id: z.string().optional().or(z.literal('')),
	name: z.string().min(3, 'Muito curto').max(100, 'Muito longo'),
	phone: z.string().min(11, 'DDD + 9 Dígitos').max(11, 'DDD + 9 Dígitos')
});
