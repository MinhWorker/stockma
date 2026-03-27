import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import type { InventorySummary } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tinh tong gia tri ton kho cua mot inventory.
 * Gia tri = SUM(stockQty * costPrice) tren tat ca san pham thuoc inventory.
 *
 * stockQty cua moi san pham = SUM(quantity) tu bang StockTransaction.
 * Vi Prisma khong ho tro correlated subquery truc tiep, ta dung raw aggregate
 * theo tung san pham roi tinh toan phia application.
 */
async function computeInventoryStockValue(
  inventoryId: number,
  products: Array<{ id: number; costPrice: number }>
): Promise<{ totalStockValue: number; stockMap: Map<number, number> }> {
  if (products.length === 0) {
    return { totalStockValue: 0, stockMap: new Map() };
  }

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
    const cost = costMap.get(productId) ?? 0;
    totalStockValue += qty * cost;
  }

  return { totalStockValue, stockMap };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lay danh sach tat ca inventory kem cac chi so tong hop:
 * - tong so san pham
 * - tong gia tri ton kho (stockQty * costPrice)
 * - so san pham sap het hang / het hang
 */
export const getAllInventories = cache(async (): Promise<InventorySummary[]> => {
  const inventories = await prisma.inventory.findMany({
    include: {
      items: {
        select: { id: true, costPrice: true, reorderLevel: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const results: InventorySummary[] = [];

  for (const inv of inventories) {
    const { totalStockValue, stockMap } = await computeInventoryStockValue(inv.id, inv.items);

    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of inv.items) {
      const qty = stockMap.get(product.id) ?? 0;
      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= product.reorderLevel) {
        lowStockCount++;
      }
    }

    results.push({
      id: inv.id,
      name: inv.name,
      description: inv.description,
      totalProducts: inv.items.length,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    });
  }

  return results;
});

/**
 * Lay chi tiet mot inventory theo id.
 */
export const getInventoryById = cache(async (id: number): Promise<InventorySummary | null> => {
  const inv = await prisma.inventory.findUnique({
    where: { id },
    include: {
      items: {
        select: { id: true, costPrice: true, reorderLevel: true },
      },
    },
  });

  if (!inv) return null;

  const { totalStockValue, stockMap } = await computeInventoryStockValue(id, inv.items);

  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const product of inv.items) {
    const qty = stockMap.get(product.id) ?? 0;
    if (qty === 0) {
      outOfStockCount++;
    } else if (qty <= product.reorderLevel) {
      lowStockCount++;
    }
  }

  return {
    id: inv.id,
    name: inv.name,
    description: inv.description,
    totalProducts: inv.items.length,
    totalStockValue,
    lowStockCount,
    outOfStockCount,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createInventory(data: {
  name: string;
  description?: string;
}): Promise<InventorySummary> {
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
  await prisma.inventory.update({ where: { id }, data });
  const updated = await getInventoryById(id);
  if (!updated) throw new Error(`Inventory ${id} not found after update.`);
  return updated;
}

export async function deleteInventory(id: number): Promise<void> {
  const productCount = await prisma.product.count({ where: { inventoryId: id } });
  if (productCount > 0) {
    throw new Error(`Cannot delete inventory ${id}: it still contains ${productCount} products.`);
  }
  await prisma.inventory.delete({ where: { id } });
}
