import { z } from 'zod';

export const inventorySchema = z.object({
	// O ID é opcional pois na criação ele não existe ainda
	id: z.uuid().optional(),

	name: z.string().trim().min(1, 'O nome do produto é obrigatório'),

	current_stock: z.coerce.number('Deve ser um número').min(0, 'O estoque não pode ser negativo'),

	min_stock_level: z.coerce
		.number('Deve ser um número')
		.min(0, 'O nível mínimo não pode ser negativo'),

	unit: z.string().trim().min(1, 'A unidade de medida é obrigatória')
});

export type InventorySchema = typeof inventorySchema;
