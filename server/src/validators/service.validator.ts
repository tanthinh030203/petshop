import { z } from 'zod';

const serviceCategoryEnum = z.enum([
  'medical',
  'grooming',
  'spa',
  'hotel',
  'vaccination',
  'surgery',
  'other',
]);

export const createServiceSchema = z.object({
  category: serviceCategoryEnum,
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(300),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  durationMin: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const updateServiceSchema = z.object({
  category: serviceCategoryEnum.optional(),
  code: z.string().max(20).optional(),
  name: z.string().max(300).optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  durationMin: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const serviceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: serviceCategoryEnum.optional(),
  search: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceQuery = z.infer<typeof serviceQuerySchema>;
