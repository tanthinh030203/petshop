import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { CreateBranchInput, UpdateBranchInput, BranchQuery } from '../validators/branch.validator';

export const getAll = async (query: BranchQuery) => {
  const { page, limit, search } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
    ];
  }

  const [branches, total] = await Promise.all([
    prisma.branch.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.branch.count({ where }),
  ]);

  return { data: branches, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) {
    throw Object.assign(new Error('Branch not found'), { statusCode: 404 });
  }
  return branch;
};

export const create = async (data: CreateBranchInput) => {
  return prisma.branch.create({ data });
};

export const update = async (id: number, data: UpdateBranchInput) => {
  await getById(id);
  return prisma.branch.update({ where: { id }, data });
};

export const remove = async (id: number) => {
  await getById(id);
  return prisma.branch.update({ where: { id }, data: { isActive: false } });
};
