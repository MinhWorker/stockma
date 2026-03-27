import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import type { CategorySummary } from './types';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAllCategories = cache(async (): Promise<CategorySummary[]> => {
  const categories = await prisma.productCategory.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
    totalProducts: c._count.products,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
});

export const getCategoryById = cache(async (id: number): Promise<CategorySummary | null> => {
  const category = await prisma.productCategory.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    state: category.state,
    totalProducts: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createCategory(data: {
  name: string;
  state: string;
}): Promise<CategorySummary> {
  const category = await prisma.productCategory.create({ data });
  return {
    id: category.id,
    name: category.name,
    state: category.state,
    totalProducts: 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function updateCategory(
  id: number,
  data: { name?: string; state?: string }
): Promise<CategorySummary> {
  const category = await prisma.productCategory.update({ where: { id }, data });
  return {
    id: category.id,
    name: category.name,
    state: category.state,
    totalProducts: 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function deleteCategory(id: number): Promise<void> {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error(`Cannot delete category ${id}: it is linked to ${productCount} products.`);
  }
  await prisma.productCategory.delete({ where: { id } });
}
