import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';

interface GetAllQuery {
  page: number;
  limit: number;
  branchId: number;
  status?: string;
  type?: string;
  date?: string;
  assignedUserId?: number;
}

export const getAll = async (query: GetAllQuery) => {
  const { page, limit, branchId, status, type, date, assignedUserId } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = { branchId };
  if (status) where.status = status;
  if (type) where.type = type;
  if (date) where.appointmentDate = new Date(date);
  if (assignedUserId) where.assignedUserId = assignedUserId;

  const [data, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
      include: {
        customer: { select: { id: true, fullName: true, phone: true, code: true } },
        pet: { select: { id: true, name: true, species: true, breed: true, code: true } },
        assignedUser: { select: { id: true, fullName: true, role: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, fullName: true, phone: true, code: true } },
      pet: { select: { id: true, name: true, species: true, breed: true, code: true } },
      assignedUser: { select: { id: true, fullName: true, role: true } },
      appointmentServices: {
        include: {
          service: { select: { id: true, name: true, code: true, basePrice: true } },
        },
      },
    },
  });

  if (!appointment) {
    throw Object.assign(new Error('Appointment not found'), { statusCode: 404 });
  }

  return appointment;
};

export const create = async (branchId: number, createdBy: number, data: any) => {
  // Check for conflicts: same pet, same date, overlapping time
  const conflicting = await prisma.appointment.findFirst({
    where: {
      petId: data.petId,
      appointmentDate: new Date(data.appointmentDate),
      status: { notIn: ['cancelled', 'no_show'] },
      OR: [
        {
          startTime: { lte: data.startTime },
          endTime: { gte: data.startTime },
        },
        {
          startTime: { lte: data.endTime || data.startTime },
          endTime: { gte: data.endTime || data.startTime },
        },
        {
          startTime: { gte: data.startTime },
          ...(data.endTime ? { endTime: { lte: data.endTime } } : {}),
        },
      ],
    },
  });

  if (conflicting) {
    throw Object.assign(
      new Error('This pet already has an appointment at the specified date/time'),
      { statusCode: 409 },
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      branchId,
      createdBy,
      customerId: data.customerId,
      petId: data.petId,
      assignedUserId: data.assignedUserId,
      appointmentDate: new Date(data.appointmentDate),
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      reason: data.reason,
      note: data.note,
    },
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      pet: { select: { id: true, name: true, species: true } },
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  return appointment;
};

export const update = async (id: number, data: any) => {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Appointment not found'), { statusCode: 404 });
  }

  const updateData: any = { ...data };
  if (data.appointmentDate) {
    updateData.appointmentDate = new Date(data.appointmentDate);
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      pet: { select: { id: true, name: true, species: true } },
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  return appointment;
};

export const updateStatus = async (id: number, status: string) => {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Appointment not found'), { statusCode: 404 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: status as any },
  });

  return appointment;
};

export const getCalendar = async (branchId: number, from: string, to: string) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      branchId,
      appointmentDate: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      pet: { select: { id: true, name: true, species: true } },
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  return appointments;
};
