import { z } from 'zod';

const speciesEnum = z.enum(['dog', 'cat', 'bird', 'hamster', 'rabbit', 'fish', 'reptile', 'other']);
const petGenderEnum = z.enum(['male', 'female', 'unknown']);

export const createPetSchema = z.object({
  customerId: z.number().int().positive(),
  name: z.string().min(1, 'Name is required').max(100),
  species: speciesEnum,
  breed: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  gender: petGenderEnum.optional(),
  dateOfBirth: z.string().datetime().optional(),
  weight: z.number().positive().optional(),
  microchipId: z.string().max(50).optional(),
  isNeutered: z.boolean().optional(),
  allergies: z.string().optional(),
  note: z.string().optional(),
});

export const updatePetSchema = z.object({
  customerId: z.number().int().positive().optional(),
  name: z.string().max(100).optional(),
  species: speciesEnum.optional(),
  breed: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  gender: petGenderEnum.optional(),
  dateOfBirth: z.string().datetime().optional(),
  weight: z.number().positive().optional(),
  microchipId: z.string().max(50).optional(),
  isNeutered: z.boolean().optional(),
  allergies: z.string().optional(),
  note: z.string().optional(),
});

export const petQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  branchId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  species: speciesEnum.optional(),
  search: z.string().optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type PetQuery = z.infer<typeof petQuerySchema>;
