import prisma from '../config/database';
import { paginate, buildPaginationMeta, generateCode } from '../utils/helpers';
import { CreateCustomerInput, UpdateCustomerInput, CustomerQuery } from '../validators/customer.validator';

export const getAll = async (query: CustomerQuery) => {
  const { page, limit, branchId, search } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { phone: { contains: search } },
      { code: { contains: search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.customer.count({ where }),
  ]);

  return { data: customers, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { pets: true },
  });
  if (!customer) {
    throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  }
  return customer;
};

export const create = async (branchId: number, data: CreateCustomerInput) => {
  const count = await prisma.customer.count();
  const code = generateCode('KH', count + 1);

  const createData: any = {
    ...data,
    branchId,
    code,
  };

  if (data.dateOfBirth) {
    createData.dateOfBirth = new Date(data.dateOfBirth);
  }

  return prisma.customer.create({ data: createData });
};

export const update = async (id: number, data: UpdateCustomerInput) => {
  await getById(id);

  const updateData: any = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  return prisma.customer.update({ where: { id }, data: updateData });
};

export const search = async (branchId: number, q: string) => {
  return prisma.customer.findMany({
    where: {
      branchId,
      OR: [
        { fullName: { contains: q } },
        { phone: { contains: q } },
      ],
    },
    take: 20,
    orderBy: { fullName: 'asc' },
  });
};

export const getPets = async (customerId: number) => {
  return prisma.pet.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
};
