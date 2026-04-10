import { z } from 'zod';

export const createVaccinationSchema = z.object({
  petId: z.number().int().positive(),
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  vaccineBatch: z.string().optional(),
  vaccinationDate: z.string().or(z.coerce.date()),
  nextDueDate: z.string().or(z.coerce.date()).optional(),
  note: z.string().optional(),
});

export type CreateVaccinationInput = z.infer<typeof createVaccinationSchema>;
