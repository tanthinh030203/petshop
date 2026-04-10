import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1, 'Name is required').max(300),
  description: z.string().optional(),
  unit: z.string().max(30).optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  isPrescription: z.boolean().optional(),
  photoUrl: z.string().max(500).optional(),
});

export const updateProductSchema = z.object({
  categoryId: z.number().int().positive().nullable().optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  name: z.string().max(300).optional(),
  description: z.string().optional(),
  unit: z.string().max(30).optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  isPrescription: z.boolean().optional(),
  photoUrl: z.string().max(500).optional(),
});

export const createCategorySchema = z.object({
  parentId: z.number().int().positive().optional(),
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  isPrescription: z.coerce
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
