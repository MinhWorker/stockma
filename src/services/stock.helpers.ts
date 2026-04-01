import 'server-only';
import { prisma } from '@/lib/db';

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Returns the latest stockAfter for a product (or variant) within a transaction.
 * Used to compute stockBefore for the next transaction.
 */
export async function getLatestStockSnapshot(
  tx: PrismaTx,
  productId: number,
  variantId?: number | null
): Promise<number> {
  const where = variantId ? { variantId } : { productId, variantId: null };
  const latest = await tx.stockTransaction.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
    select: { stockAfter: true },
  });
  return latest?.stockAfter ?? 0;
}

/**
 * Aggregates total stock quantity for a single product across all transactions.
 */
export async function fetchProductStockQuantity(productId: number): Promise<number> {
  const result = await prisma.stockTransaction.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

/**
 * Aggregates total stock quantity for a single variant across all transactions.
 */
export async function fetchVariantStockQuantity(variantId: number): Promise<number> {
  const result = await prisma.stockTransaction.aggregate({
    where: { variantId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
