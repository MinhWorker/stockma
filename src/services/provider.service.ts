import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { requireNonEmpty } from './validation';
import type { ProviderSummary } from './types';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAllProviders = cache(async (): Promise<ProviderSummary[]> => {
  const providers = await prisma.provider.findMany({
    include: {
      _count: { select: { provideItems: true } },
    },
    orderBy: { name: 'asc' },
  });

  return providers.map((p) => ({
    id: p.id,
    name: p.name,
    totalProducts: p._count.provideItems,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
});

export const getProviderById = cache(async (id: number): Promise<ProviderSummary | null> => {
  const provider = await prisma.provider.findUnique({
    where: { id },
    include: { _count: { select: { provideItems: true } } },
  });
  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.name,
    totalProducts: provider._count.provideItems,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createProvider(data: { name: string }): Promise<ProviderSummary> {
  requireNonEmpty(data.name, 'Provider name');
  const provider = await prisma.provider.create({ data });
  return {
    id: provider.id,
    name: provider.name,
    totalProducts: 0,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export async function updateProvider(id: number, data: { name: string }): Promise<ProviderSummary> {
  requireNonEmpty(data.name, 'Provider name');
  const provider = await prisma.provider.update({ where: { id }, data });
  return {
    id: provider.id,
    name: provider.name,
    totalProducts: 0,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export async function deleteProvider(id: number): Promise<void> {
  const productCount = await prisma.product.count({ where: { providerId: id } });
  if (productCount > 0) {
    throw new Error('ERR_HAS_PRODUCTS');
  }
  await prisma.provider.delete({ where: { id } });
}
