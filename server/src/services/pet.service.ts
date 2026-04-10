import prisma from '../config/database';
import { paginate, buildPaginationMeta, generateCode } from '../utils/helpers';
import { CreatePetInput, UpdatePetInput, PetQuery } from '../validators/pet.validator';

export const getAll = async (query: PetQuery) => {
  const { page, limit, branchId, customerId, species, search } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (customerId) where.customerId = customerId;
  if (species) where.species = species;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
    ];
  }

  const [pets, total] = await Promise.all([
    prisma.pet.findMany({
      where,
      skip,
      take,
      include: { customer: { select: { id: true, fullName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pet.count({ where }),
  ]);

  return { data: pets, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      customer: true,
      medicalRecords: { orderBy: { visitDate: 'desc' }, take: 10 },
      vaccinations: { orderBy: { vaccinationDate: 'desc' }, take: 10 },
    },
  });
  if (!pet) {
    throw Object.assign(new Error('Pet not found'), { statusCode: 404 });
  }
  return pet;
};

export const create = async (branchId: number, data: CreatePetInput) => {
  const count = await prisma.pet.count();
  const code = generateCode('PET', count + 1);

  const createData: any = {
    ...data,
    branchId,
    code,
  };

  if (data.dateOfBirth) {
    createData.dateOfBirth = new Date(data.dateOfBirth);
  }

  return prisma.pet.create({ data: createData });
};

export const update = async (id: number, data: UpdatePetInput) => {
  await getById(id);

  const updateData: any = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  return prisma.pet.update({ where: { id }, data: updateData });
};

export const getMedicalRecords = async (petId: number) => {
  return prisma.medicalRecord.findMany({
    where: { petId },
    include: { vet: { select: { id: true, fullName: true } } },
    orderBy: { visitDate: 'desc' },
  });
};

export const getVaccinations = async (petId: number) => {
  return prisma.vaccination.findMany({
    where: { petId },
    include: { vet: { select: { id: true, fullName: true } } },
    orderBy: { vaccinationDate: 'desc' },
  });
};

export const getAppointments = async (petId: number) => {
  return prisma.appointment.findMany({
    where: { petId },
    include: {
      assignedUser: { select: { id: true, fullName: true } },
      appointmentServices: { include: { service: true } },
    },
    orderBy: { appointmentDate: 'desc' },
  });
};
