import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { CreateUserInput, UpdateUserInput, UserQuery } from '../validators/user.validator';

const userSelect = {
  id: true,
  branchId: true,
  username: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

export const getAll = async (query: UserQuery) => {
  const { page, limit, branchId, role, search } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { username: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, select: userSelect, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return { data: users, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

export const create = async (data: CreateUserInput) => {
  const { password, ...rest } = data;
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: { ...rest, passwordHash },
    select: userSelect,
  });
};

export const update = async (id: number, data: UpdateUserInput) => {
  await getById(id);

  const { password, ...rest } = data;
  const updateData: any = { ...rest };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });
};

export const updateStatus = async (id: number, isActive: boolean) => {
  await getById(id);
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: userSelect,
  });
};
