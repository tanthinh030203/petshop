import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { CreateServiceInput, UpdateServiceInput, ServiceQuery } from '../validators/service.validator';

export const getAll = async (query: ServiceQuery) => {
  const { page, limit, category, search } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
    ];
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.service.count({ where }),
  ]);

  return { data: services, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  }
  return service;
};

export const create = async (data: CreateServiceInput) => {
  return prisma.service.create({ data });
};

export const update = async (id: number, data: UpdateServiceInput) => {
  await getById(id);
  return prisma.service.update({ where: { id }, data });
};
