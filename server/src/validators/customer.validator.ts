import { z } from 'zod';

const genderEnum = z.enum(['male', 'female', 'other']);

export const createCustomerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email().max(100).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: genderEnum.optional(),
  idNumber: z.string().max(50).optional(),
  note: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: genderEnum.optional(),
  idNumber: z.string().max(50).optional(),
  note: z.string().optional(),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  branchId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export const customerSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  branchId: z.coerce.number().int().positive().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
export type CustomerSearchQuery = z.infer<typeof customerSearchSchema>;
