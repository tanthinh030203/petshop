import { z } from 'zod';

export const createMedicalRecordSchema = z.object({
  appointmentId: z.number().int().positive(),
  petId: z.number().int().positive(),
  visitDate: z.string().or(z.coerce.date()),
  weight: z.number().positive().optional(),
  temperature: z.number().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  note: z.string().optional(),
  followUpDate: z.string().or(z.coerce.date()).optional(),
});

export const updateMedicalRecordSchema = z.object({
  visitDate: z.string().or(z.coerce.date()).optional(),
  weight: z.number().positive().optional(),
  temperature: z.number().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  note: z.string().optional(),
  followUpDate: z.string().or(z.coerce.date()).optional(),
});

export const createPrescriptionSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    durationDays: z.number().int().positive().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    note: z.string().optional(),
  })).min(1, 'At least one prescription item is required'),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
