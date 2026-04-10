import prisma from '../config/database';

export const create = async (branchId: number, vetId: number, data: any) => {
  const vaccination = await prisma.vaccination.create({
    data: {
      branchId,
      vetId,
      petId: data.petId,
      vaccineName: data.vaccineName,
      vaccineBatch: data.vaccineBatch,
      vaccinationDate: new Date(data.vaccinationDate),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      note: data.note,
    },
    include: {
      pet: { select: { id: true, name: true, species: true, code: true } },
      vet: { select: { id: true, fullName: true } },
    },
  });

  return vaccination;
};

export const getById = async (id: number) => {
  const vaccination = await prisma.vaccination.findUnique({
    where: { id },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, code: true } },
      vet: { select: { id: true, fullName: true, role: true } },
    },
  });

  if (!vaccination) {
    throw Object.assign(new Error('Vaccination record not found'), { statusCode: 404 });
  }

  return vaccination;
};

export const getReminders = async (branchId: number, daysAhead: number = 7) => {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  const vaccinations = await prisma.vaccination.findMany({
    where: {
      branchId,
      nextDueDate: {
        gte: now,
        lte: future,
      },
    },
    orderBy: { nextDueDate: 'asc' },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          species: true,
          code: true,
          customer: { select: { id: true, fullName: true, phone: true } },
        },
      },
      vet: { select: { id: true, fullName: true } },
    },
  });

  return vaccinations;
};
