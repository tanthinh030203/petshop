import { z } from 'zod';

export const createBookingSchema = z.object({
  petId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  appointmentId: z.number().int().positive().optional(),
  roomNumber: z.string().optional(),
  checkIn: z.string().or(z.coerce.date()),
  expectedCheckOut: z.string().or(z.coerce.date()),
  dailyRate: z.number().nonnegative(),
  specialRequests: z.string().optional(),
  note: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
