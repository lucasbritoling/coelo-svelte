import { z } from 'zod';

export const customerSchema = z.object({
	id: z.uuid().optional().or(z.literal('')),
	name: z.string().min(3, 'Muito curto').max(100, 'Muito longo'),
	phone: z.string().min(11, 'DDD + 9 Dígitos').max(11, 'DDD + 9 Dígitos')
});

export const serviceSchema = z.object({
	id: z.uuid().optional().or(z.literal('')),

	name: z.string().min(3, 'Muito curto').max(100, 'Muito longo'),

	duration: z.coerce
		.number()
		.int('A duração deve ser um número inteiro')
		.min(1, 'Duração mínima de 1 minuto'),

	min_notice_hours: z.number().min(0).default(2),
	buffer_after_min: z.number().min(0).default(0),
	is_active: z.boolean().default(true)
});
