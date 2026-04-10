import prisma from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  ProductQuery,
} from '../validators/product.validator';

export const getAll = async (query: ProductQuery) => {
  const { page, limit, categoryId, search, isPrescription } = query;
  const { skip, take } = paginate(page, limit);

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (isPrescription !== undefined) where.isPrescription = isPrescription;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { barcode: { contains: search } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { data: products, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id: number) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }
  return product;
};

export const create = async (data: CreateProductInput) => {
  return prisma.product.create({ data });
};

export const update = async (id: number, data: UpdateProductInput) => {
  await getById(id);
  return prisma.product.update({ where: { id }, data });
};

export const getCategories = async () => {
  return prisma.productCategory.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: { children: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
};

export const createCategory = async (data: CreateCategoryInput) => {
  return prisma.productCategory.create({ data });
};
