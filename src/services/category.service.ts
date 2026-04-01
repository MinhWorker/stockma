import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { requireNonEmpty } from './validation';
import type { CategorySummary } from './types';

const VALID_CATEGORY_STATES = ['active', 'inactive'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapToCategorySummary(
  category: {
    id: number;
    name: string;
    state: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { products: number };
  }
): CategorySummary {
  return {
    id: category.id,
    name: category.name,
    state: category.state,
    totalProducts: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function validateCategoryState(state: string): void {
  if (!VALID_CATEGORY_STATES.includes(state)) {
    throw new Error(`ERR_INVALID_CATEGORY_STATE: ${state}`);
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAllCategories = cache(async (): Promise<CategorySummary[]> => {
  const categories = await prisma.productCategory.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  return categories.map(mapToCategorySummary);
});

export const getCategoryById = cache(async (id: number): Promise<CategorySummary | null> => {
  const category = await prisma.productCategory.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) return null;
  return mapToCategorySummary(category);
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createCategory(data: { name: string; state: string }): Promise<CategorySummary> {
  requireNonEmpty(data.name, 'Category name');
  validateCategoryState(data.state);
  const category = await prisma.productCategory.create({ data });
  return { ...mapToCategorySummary({ ...category, _count: { products: 0 } }) };
}

export async function updateCategory(
  id: number,
  data: { name?: string; state?: string }
): Promise<CategorySummary> {
  if (data.name !== undefined) requireNonEmpty(data.name, 'Category name');
  if (data.state !== undefined) validateCategoryState(data.state);

  const category = await prisma.productCategory.update({
    where: { id },
    data,
    include: { _count: { select: { products: true } } },
  });
  return mapToCategorySummary(category);
}

export async function deleteCategory(id: number): Promise<void> {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) throw new Error('ERR_HAS_PRODUCTS');
  await prisma.productCategory.delete({ where: { id } });
}
