import { z } from 'zod';

export const createAppointmentSchema = z.object({
  customerId: z.number().int().positive(),
  petId: z.number().int().positive(),
  assignedUserId: z.number().int().positive().optional(),
  appointmentDate: z.string().or(z.coerce.date()),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional(),
  type: z.enum(['medical', 'grooming', 'vaccination', 'surgery', 'checkup', 'hotel']),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  customerId: z.number().int().positive().optional(),
  petId: z.number().int().positive().optional(),
  assignedUserId: z.number().int().positive().nullable().optional(),
  appointmentDate: z.string().or(z.coerce.date()).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional(),
  type: z.enum(['medical', 'grooming', 'vaccination', 'surgery', 'checkup', 'hotel']).optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
