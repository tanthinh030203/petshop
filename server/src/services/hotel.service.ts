import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';

interface GetAllQuery {
  page: number;
  limit: number;
  branchId: number;
  status?: string;
}

export const getAll = async (query: GetAllQuery) => {
  const { page, limit, branchId, status } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = { branchId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.hotelBooking.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        pet: { select: { id: true, name: true, species: true, code: true } },
        customer: { select: { id: true, fullName: true, phone: true, code: true } },
      },
    }),
    prisma.hotelBooking.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const create = async (branchId: number, data: any) => {
  const booking = await prisma.hotelBooking.create({
    data: {
      branchId,
      petId: data.petId,
      customerId: data.customerId,
      appointmentId: data.appointmentId,
      roomNumber: data.roomNumber,
      checkIn: new Date(data.checkIn),
      expectedCheckOut: new Date(data.expectedCheckOut),
      dailyRate: data.dailyRate,
      specialRequests: data.specialRequests,
      note: data.note,
    },
    include: {
      pet: { select: { id: true, name: true, species: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
    },
  });

  return booking;
};

export const checkIn = async (id: number) => {
  const booking = await prisma.hotelBooking.findUnique({ where: { id } });
  if (!booking) {
    throw Object.assign(new Error('Hotel booking not found'), { statusCode: 404 });
  }
  if (booking.status !== 'booked') {
    throw Object.assign(new Error('Booking must be in "booked" status to check in'), { statusCode: 400 });
  }

  const updated = await prisma.hotelBooking.update({
    where: { id },
    data: {
      status: 'checked_in',
      checkIn: new Date(),
    },
    include: {
      pet: { select: { id: true, name: true, species: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
    },
  });

  return updated;
};

export const checkOut = async (id: number) => {
  const booking = await prisma.hotelBooking.findUnique({ where: { id } });
  if (!booking) {
    throw Object.assign(new Error('Hotel booking not found'), { statusCode: 404 });
  }
  if (booking.status !== 'checked_in') {
    throw Object.assign(new Error('Booking must be in "checked_in" status to check out'), { statusCode: 400 });
  }

  const updated = await prisma.hotelBooking.update({
    where: { id },
    data: {
      status: 'checked_out',
      checkOut: new Date(),
    },
    include: {
      pet: { select: { id: true, name: true, species: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
    },
  });

  return updated;
};
