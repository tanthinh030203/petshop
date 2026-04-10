import { z } from 'zod';

const userRoleEnum = z.enum([
  'super_admin',
  'branch_mgr',
  'veterinarian',
  'receptionist',
  'sales_staff',
  'groomer',
  'accountant',
]);

export const createUserSchema = z.object({
  branchId: z.number().int().positive(),
  username: z.string().min(1, 'Username is required').max(50),
  email: z.string().email().max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(200),
  phone: z.string().max(20).optional(),
  role: userRoleEnum,
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  branchId: z.number().int().positive().optional(),
  username: z.string().max(50).optional(),
  email: z.string().email().max(100).optional(),
  password: z.string().min(6).optional(),
  fullName: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  branchId: z.coerce.number().int().positive().optional(),
  role: userRoleEnum.optional(),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
