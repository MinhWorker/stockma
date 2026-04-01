import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { requireNonEmpty } from './validation';
import type { InventorySummary } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function calculateInventoryStockMetrics(
  inventoryId: number,
  products: Array<{ id: number; costPrice: number }>
): Promise<{ totalStockValue: number; stockMap: Map<number, number> }> {
  if (products.length === 0) return { totalStockValue: 0, stockMap: new Map() };

  const productIds = products.map((p) => p.id);
  const stockAggregates = await prisma.stockTransaction.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  });

  const stockMap = new Map<number, number>(
    stockAggregates.map((row) => [row.productId, row._sum.quantity ?? 0])
  );
  const costMap = new Map<number, number>(products.map((p) => [p.id, p.costPrice]));

  let totalStockValue = 0;
  for (const [productId, qty] of stockMap.entries()) {
    totalStockValue += qty * (costMap.get(productId) ?? 0);
  }

  return { totalStockValue, stockMap };
}

function countOutOfStock(
  products: Array<{ id: number }>,
  stockMap: Map<number, number>
): number {
  return products.filter((p) => (stockMap.get(p.id) ?? 0) === 0).length;
}

function buildInventorySummary(
  inv: { id: number; name: string; description: string | null; createdAt: Date; updatedAt: Date; items: Array<{ id: number; costPrice: number }> },
  totalStockValue: number,
  stockMap: Map<number, number>
): InventorySummary {
  return {
    id: inv.id,
    name: inv.name,
    description: inv.description,
    totalProducts: inv.items.length,
    totalStockValue,
    lowStockCount: 0,
    outOfStockCount: countOutOfStock(inv.items, stockMap),
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAllInventories = cache(async (): Promise<InventorySummary[]> => {
  const inventories = await prisma.inventory.findMany({
    include: { items: { select: { id: true, costPrice: true } } },
    orderBy: { name: 'asc' },
  });

  return Promise.all(
    inventories.map(async (inv) => {
      const { totalStockValue, stockMap } = await calculateInventoryStockMetrics(inv.id, inv.items);
      return buildInventorySummary(inv, totalStockValue, stockMap);
    })
  );
});

export const getInventoryById = cache(async (id: number): Promise<InventorySummary | null> => {
  const inv = await prisma.inventory.findUnique({
    where: { id },
    include: { items: { select: { id: true, costPrice: true } } },
  });
  if (!inv) return null;

  const { totalStockValue, stockMap } = await calculateInventoryStockMetrics(id, inv.items);
  return buildInventorySummary(inv, totalStockValue, stockMap);
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createInventory(data: {
  name: string;
  description?: string;
}): Promise<InventorySummary> {
  requireNonEmpty(data.name, 'Inventory name');
  const inv = await prisma.inventory.create({ data });
  return {
    id: inv.id,
    name: inv.name,
    description: inv.description,
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
}

export async function updateInventory(
  id: number,
  data: { name?: string; description?: string }
): Promise<InventorySummary> {
  if (data.name !== undefined) requireNonEmpty(data.name, 'Inventory name');
  await prisma.inventory.update({ where: { id }, data });
  const updated = await getInventoryById(id);
  if (!updated) throw new Error(`ERR_INVENTORY_NOT_FOUND`);
  return updated;
}

export async function deleteInventory(id: number): Promise<void> {
  const productCount = await prisma.product.count({ where: { inventoryId: id } });
  if (productCount > 0) throw new Error('ERR_HAS_PRODUCTS');
  await prisma.inventory.delete({ where: { id } });
}
