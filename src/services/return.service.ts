import 'server-only';
import { prisma } from '@/lib/db';
import { resolveEffectivePrices } from './variant.service';
import { getLatestStockSnapshot } from './stock.helpers';
import type { CreateReturnInput, ReturnRecord } from './types';

export const RETURN_CACHE_TAG = 'returns';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getReturnTransactions(options?: {
  productId?: number;
  inventoryId?: number;
}): Promise<ReturnRecord[]> {
  const rows = await prisma.returnTransaction.findMany({
    where: {
      ...(options?.productId && { productId: options.productId }),
      ...(options?.inventoryId && { product: { inventoryId: options.inventoryId } }),
    },
    include: {
      product: { select: { name: true } },
      variant: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    productName: r.product.name,
    variantId: r.variantId,
    variantName: r.variant?.name ?? null,
    returnQty: r.returnQty,
    replacementQty: r.replacementQty,
    note: r.note,
    userId: r.userId,
    userName: r.user.name,
    createdAt: r.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createReturnTransaction(input: CreateReturnInput): Promise<ReturnRecord> {
  if (input.returnQty < 0 || input.replacementQty < 0) throw new Error('ERR_RETURN_QTY_INVALID');
  if (input.returnQty + input.replacementQty === 0) throw new Error('ERR_RETURN_QTY_INVALID');
  if (input.purchasePrice !== undefined && input.purchasePrice !== null && input.purchasePrice <= 0) {
    throw new Error('ERR_INVALID_PURCHASE_PRICE');
  }

  const result = await prisma.$transaction(async (tx) => {
    if (input.variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        select: { productId: true },
      });
      if (!variant || variant.productId !== input.productId) throw new Error('ERR_VARIANT_NOT_FOUND');
    }

    const variantCount = await tx.productVariant.count({ where: { productId: input.productId } });
    if (variantCount > 0 && !input.variantId) throw new Error('ERR_VARIANT_REQUIRED');

    const product = await tx.product.findUniqueOrThrow({
      where: { id: input.productId },
      select: { costPrice: true, price: true, unit: true },
    });

    let variantData: { costPrice: number | null; price: number | null; unit: string | null } | null = null;
    if (input.variantId) {
      variantData = await tx.productVariant.findUniqueOrThrow({
        where: { id: input.variantId },
        select: { costPrice: true, price: true, unit: true },
      });
    }

    const { effectiveCostPrice } = resolveEffectivePrices(product, variantData);
    const resolvedPurchasePrice = input.purchasePrice ?? effectiveCostPrice;

    if (input.returnQty > 0) {
      const currentStock = await getLatestStockSnapshot(tx, input.productId, input.variantId);
      if (currentStock - input.returnQty < 0) throw new Error('ERR_INSUFFICIENT_STOCK');
    }

    const returnRecord = await tx.returnTransaction.create({
      data: {
        productId: input.productId,
        ...(input.variantId && { variantId: input.variantId }),
        returnQty: input.returnQty,
        replacementQty: input.replacementQty,
        purchasePrice: input.purchasePrice,
        note: input.note,
        userId: input.userId,
      },
      include: {
        product: { select: { name: true } },
        variant: { select: { name: true } },
        user: { select: { name: true } },
      },
    });

    if (input.returnQty > 0) {
      const stockBefore = await getLatestStockSnapshot(tx, input.productId, input.variantId);
      await tx.stockTransaction.create({
        data: {
          type: 'stock_out',
          quantity: -input.returnQty,
          stockBefore,
          stockAfter: stockBefore - input.returnQty,
          productId: input.productId,
          userId: input.userId,
          ...(input.variantId && { variantId: input.variantId }),
          returnTransactionId: returnRecord.id,
        },
      });
    }

    if (input.replacementQty > 0) {
      const stockBefore = await getLatestStockSnapshot(tx, input.productId, input.variantId);
      await tx.stockTransaction.create({
        data: {
          type: 'stock_in',
          quantity: input.replacementQty,
          stockBefore,
          stockAfter: stockBefore + input.replacementQty,
          productId: input.productId,
          userId: input.userId,
          ...(input.variantId && { variantId: input.variantId }),
          purchasePrice: resolvedPurchasePrice,
          returnTransactionId: returnRecord.id,
        },
      });
    }

    return returnRecord;
  });

  return {
    id: result.id,
    productId: result.productId,
    productName: result.product.name,
    variantId: result.variantId,
    variantName: result.variant?.name ?? null,
    returnQty: result.returnQty,
    replacementQty: result.replacementQty,
    note: result.note,
    userId: result.userId,
    userName: result.user.name,
    createdAt: result.createdAt,
  };
}
