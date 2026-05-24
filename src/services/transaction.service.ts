import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { requireNonEmpty } from './validation';
import { resolveEffectivePrices } from './variant.service';
import { getLatestStockSnapshot } from './stock.helpers';
import { getCurrentAccountingPeriodForWrite } from './accounting-period.service';
import type {
  TransactionRecord,
  CreateTransactionInput,
  CreateStockOutInput,
  CreateTransactionCorrectionInput,
  TransactionType,
} from './types';

export const TRANSACTION_CACHE_TAG = 'transactions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapToTransactionRecord(tx: {
  id: number;
  type: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string | null;
  productId: number;
  product: { name: string };
  userId: string;
  user: { name: string | null };
  variantId: number | null;
  variant: { name: string } | null;
  stockOutType: string | null;
  salePrice: number | null;
  purchasePrice: number | null;
  isGift: boolean;
  parentTransactionId: number | null;
  returnTransactionId: number | null;
  targetTransactionId: number | null;
  correctionType: string | null;
  correctedQuantity: number | null;
  createdAt: Date;
}): TransactionRecord {
  return {
    id: tx.id,
    type: tx.type as TransactionRecord['type'],
    quantity: tx.quantity,
    stockBefore: tx.stockBefore,
    stockAfter: tx.stockAfter,
    note: tx.note,
    productId: tx.productId,
    productName: tx.product.name,
    userId: tx.userId,
    userName: tx.user.name,
    variantId: tx.variantId,
    variantName: tx.variant?.name ?? null,
    stockOutType: tx.stockOutType as TransactionRecord['stockOutType'],
    salePrice: tx.salePrice,
    purchasePrice: tx.purchasePrice,
    isGift: tx.isGift,
    parentTransactionId: tx.parentTransactionId,
    returnTransactionId: tx.returnTransactionId,
    targetTransactionId: tx.targetTransactionId,
    correctionType: tx.correctionType as TransactionRecord['correctionType'],
    correctedQuantity: tx.correctedQuantity,
    createdAt: tx.createdAt,
  };
}

const TRANSACTION_INCLUDE = {
  product: { select: { name: true } },
  user: { select: { name: true } },
  variant: { select: { name: true } },
} as const;

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export function calculateCancellationDelta(input: { targetQuantity: number }): number {
  return -input.targetQuantity;
}

export function calculateCorrectionDelta(input: {
  targetType: TransactionType;
  targetQuantity: number;
  correctedQuantity: number;
}): number {
  const correctedSignedQuantity =
    input.targetType === 'stock_out'
      ? -Math.abs(input.correctedQuantity)
      : input.targetType === 'stock_in'
        ? Math.abs(input.correctedQuantity)
        : input.correctedQuantity;

  return correctedSignedQuantity - input.targetQuantity;
}

/**
 * Throws ERR_VARIANT_REQUIRED if the product has variants but no variantId was provided.
 * Enforces that variant-based products always specify which variant is being transacted.
 */
async function ensureVariantProvidedIfRequired(
  tx: PrismaTx,
  productId: number,
  variantId?: number | null
): Promise<void> {
  if (variantId) return;
  const variantCount = await tx.productVariant.count({ where: { productId } });
  if (variantCount > 0) throw new Error('ERR_VARIANT_REQUIRED');
}

async function fetchEffectivePricesForTransaction(
  tx: PrismaTx,
  productId: number,
  variantId?: number | null
) {
  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
    select: { costPrice: true, price: true, unit: true },
  });

  let variantData: { costPrice: number | null; price: number | null; unit: string | null } | null = null;
  if (variantId) {
    variantData = await tx.productVariant.findUniqueOrThrow({
      where: { id: variantId },
      select: { costPrice: true, price: true, unit: true },
    });
  }

  return resolveEffectivePrices(product, variantData);
}

async function validateVariantBelongsToProduct(
  tx: PrismaTx,
  variantId: number,
  productId: number
): Promise<void> {
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  });
  if (!variant || variant.productId !== productId) throw new Error('ERR_VARIANT_NOT_FOUND');
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getTransactions = cache(
  async (options?: { productId?: number; limit?: number; accountingPeriodId?: number }): Promise<TransactionRecord[]> => {
    const rows = await prisma.stockTransaction.findMany({
      where: {
        ...(options?.productId ? { productId: options.productId } : {}),
        ...(options?.accountingPeriodId ? { accountingPeriodId: options.accountingPeriodId } : {}),
      },
      include: TRANSACTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
    });
    return rows.map(mapToTransactionRecord);
  }
);

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createTransaction(input: CreateTransactionInput): Promise<TransactionRecord> {
  requireNonEmpty(input.userId, 'User ID');
  if (!input.quantity || input.quantity === 0) throw new Error('ERR_INVALID_QUANTITY');
  if (!input.productId) throw new Error('ERR_PRODUCT_REQUIRED');
  if (input.type === 'stock_out' && !input.stockOutType) throw new Error('ERR_STOCK_OUT_TYPE_REQUIRED');
  if (input.salePrice != null && input.salePrice <= 0) throw new Error('ERR_INVALID_SALE_PRICE');
  if (input.purchasePrice != null && input.purchasePrice <= 0) throw new Error('ERR_INVALID_PURCHASE_PRICE');
  // Enforce quantity sign: stock_in must be positive, stock_out must be negative
  if (input.type === 'stock_in' && input.quantity < 0) throw new Error('ERR_INVALID_QUANTITY');
  if (input.type === 'stock_out' && input.quantity > 0) throw new Error('ERR_INVALID_QUANTITY');

  const result = await prisma.$transaction(async (tx) => {
    const accountingPeriod = await getCurrentAccountingPeriodForWrite(tx);

    if (input.variantId) {
      await validateVariantBelongsToProduct(tx, input.variantId, input.productId);
    }
    await ensureVariantProvidedIfRequired(tx, input.productId, input.variantId);

    const { effectiveCostPrice, effectivePrice } = await fetchEffectivePricesForTransaction(
      tx,
      input.productId,
      input.variantId
    );

    const resolvedSalePrice =
      input.type !== 'stock_out' ? null
      : input.stockOutType === 'transfer' ? null
      : (input.salePrice ?? effectivePrice);

    const resolvedPurchasePrice =
      input.type === 'stock_in' ? (input.purchasePrice ?? effectiveCostPrice) : null;

    const stockBefore = await getLatestStockSnapshot(tx, input.productId, input.variantId, accountingPeriod.id);
    const stockAfter = stockBefore + input.quantity;
    if (stockAfter < 0) throw new Error('ERR_INSUFFICIENT_STOCK');

    return tx.stockTransaction.create({
      data: {
        type: input.type,
        quantity: input.quantity,
        stockBefore,
        stockAfter,
        note: input.note,
        productId: input.productId,
        userId: input.userId,
        ...(input.variantId && { variantId: input.variantId }),
        ...(input.stockOutType && { stockOutType: input.stockOutType }),
        ...(resolvedSalePrice !== null && { salePrice: resolvedSalePrice }),
        ...(resolvedPurchasePrice !== null && { purchasePrice: resolvedPurchasePrice }),
        isGift: input.isGift ?? false,
        accountingPeriodId: accountingPeriod.id,
        ...(input.parentTransactionId && { parentTransactionId: input.parentTransactionId }),
      },
      include: TRANSACTION_INCLUDE,
    });
  });

  return mapToTransactionRecord(result);
}

export interface StockOutResult {
  mainTransaction: TransactionRecord;
  giftTransactions: TransactionRecord[];
}

export async function createStockOutWithGifts(input: CreateStockOutInput): Promise<StockOutResult> {
  requireNonEmpty(input.userId, 'User ID');
  if (!input.quantity || input.quantity === 0) throw new Error('ERR_INVALID_QUANTITY');
  if (!input.productId) throw new Error('ERR_PRODUCT_REQUIRED');
  if (!input.stockOutType) throw new Error('ERR_STOCK_OUT_TYPE_REQUIRED');
  if (input.stockOutType === 'transfer' && input.gifts?.length) throw new Error('ERR_GIFT_NOT_ALLOWED');
  if (input.stockOutType === 'transfer' && input.debtorName) throw new Error('ERR_DEBT_NOT_ALLOWED');
  if (input.salePrice != null && input.salePrice <= 0) throw new Error('ERR_INVALID_SALE_PRICE');

  const result = await prisma.$transaction(async (tx) => {
    const accountingPeriod = await getCurrentAccountingPeriodForWrite(tx);

    if (input.variantId) {
      await validateVariantBelongsToProduct(tx, input.variantId, input.productId);
    }
    await ensureVariantProvidedIfRequired(tx, input.productId, input.variantId);

    const { effectivePrice } = await fetchEffectivePricesForTransaction(tx, input.productId, input.variantId);
    const resolvedSalePrice = input.stockOutType === 'transfer' ? null : (input.salePrice ?? effectivePrice);

    const mainStockBefore = await getLatestStockSnapshot(tx, input.productId, input.variantId, accountingPeriod.id);
    const mainStockAfter = mainStockBefore + input.quantity; // quantity is negative for stock_out
    if (mainStockAfter < 0) throw new Error('ERR_INSUFFICIENT_STOCK');

    // Pre-validate gift stock before any writes
    const giftStockMap = new Map<string, number>();
    for (const gift of input.gifts ?? []) {
      if (gift.quantity <= 0) throw new Error('ERR_INVALID_GIFT_QUANTITY');
      if (gift.variantId) {
        await validateVariantBelongsToProduct(tx, gift.variantId, gift.productId);
      }
      await ensureVariantProvidedIfRequired(tx, gift.productId, gift.variantId);

      const giftKey = `${gift.productId}:${gift.variantId ?? 'null'}`;
      if (!giftStockMap.has(giftKey)) {
        giftStockMap.set(giftKey, await getLatestStockSnapshot(tx, gift.productId, gift.variantId, accountingPeriod.id));
      }
      const remainingStock = giftStockMap.get(giftKey)! - gift.quantity;
      if (remainingStock < 0) throw new Error('ERR_INSUFFICIENT_STOCK');
      giftStockMap.set(giftKey, remainingStock);
    }

    const mainTx = await tx.stockTransaction.create({
      data: {
        type: 'stock_out',
        quantity: input.quantity,
        stockBefore: mainStockBefore,
        stockAfter: mainStockAfter,
        note: input.note,
        productId: input.productId,
        userId: input.userId,
        ...(input.variantId && { variantId: input.variantId }),
        stockOutType: input.stockOutType,
        ...(resolvedSalePrice !== null && { salePrice: resolvedSalePrice }),
        isGift: false,
        accountingPeriodId: accountingPeriod.id,
      },
      include: TRANSACTION_INCLUDE,
    });

    if (input.debtorName && resolvedSalePrice !== null) {
      const totalAmount = resolvedSalePrice * Math.abs(input.quantity);
      const paidAmount = input.paidAmount ?? 0;
      if (paidAmount < totalAmount) {
        await tx.debtGroup.create({
          data: {
            transactionId: mainTx.id,
            debtorName: input.debtorName,
            totalAmount,
            paidAmount,
            initialPaidAmount: paidAmount,
            status: 'open',
          },
        });
      }
    }

    const giftTransactions: TransactionRecord[] = [];
    const writtenStockMap = new Map<string, number>();

    for (const gift of input.gifts ?? []) {
      const giftKey = `${gift.productId}:${gift.variantId ?? 'null'}`;
      if (!writtenStockMap.has(giftKey)) {
        writtenStockMap.set(giftKey, await getLatestStockSnapshot(tx, gift.productId, gift.variantId, accountingPeriod.id));
      }
      const giftStockBefore = writtenStockMap.get(giftKey)!;
      const giftStockAfter = giftStockBefore - gift.quantity;
      writtenStockMap.set(giftKey, giftStockAfter);

      const giftTx = await tx.stockTransaction.create({
        data: {
          type: 'stock_out',
          quantity: -gift.quantity,
          stockBefore: giftStockBefore,
          stockAfter: giftStockAfter,
          productId: gift.productId,
          userId: input.userId,
          ...(gift.variantId && { variantId: gift.variantId }),
          stockOutType: input.stockOutType,
          salePrice: 0,
          isGift: true,
          accountingPeriodId: accountingPeriod.id,
          parentTransactionId: mainTx.id,
        },
        include: TRANSACTION_INCLUDE,
      });
      giftTransactions.push(mapToTransactionRecord(giftTx));
    }

    return { mainTx, giftTransactions };
  });

  return {
    mainTransaction: mapToTransactionRecord(result.mainTx),
    giftTransactions: result.giftTransactions,
  };
}

export async function createTransactionCorrection(
  input: CreateTransactionCorrectionInput
): Promise<TransactionRecord> {
  requireNonEmpty(input.userId, 'User ID');
  if (!input.targetTransactionId) throw new Error('ERR_TRANSACTION_REQUIRED');

  const result = await prisma.$transaction(async (tx) => {
    const accountingPeriod = await getCurrentAccountingPeriodForWrite(tx);
    const target = await tx.stockTransaction.findUnique({
      where: { id: input.targetTransactionId },
      include: TRANSACTION_INCLUDE,
    });
    if (!target) throw new Error('ERR_TRANSACTION_NOT_FOUND');
    if (target.correctionType) throw new Error('ERR_CORRECTION_TARGET_INVALID');
    if (target.accountingPeriodId !== accountingPeriod.id) throw new Error('ERR_PERIOD_CLOSED');

    const previousCorrections = await tx.stockTransaction.aggregate({
      where: { targetTransactionId: target.id },
      _sum: { quantity: true },
    });
    const effectiveTargetQuantity = target.quantity + (previousCorrections._sum.quantity ?? 0);

    let delta: number;
    let correctedQuantity: number;

    if (input.correctionType === 'cancellation') {
      delta = calculateCancellationDelta({ targetQuantity: effectiveTargetQuantity });
      correctedQuantity = 0;
    } else {
      if (input.correctedQuantity == null || input.correctedQuantity === 0) {
        throw new Error('ERR_INVALID_QUANTITY');
      }
      if (target.type !== 'adjustment' && input.correctedQuantity < 0) {
        throw new Error('ERR_INVALID_QUANTITY');
      }
      delta = calculateCorrectionDelta({
        targetType: target.type,
        targetQuantity: effectiveTargetQuantity,
        correctedQuantity: input.correctedQuantity,
      });
      correctedQuantity = input.correctedQuantity;
    }

    if (delta === 0) throw new Error('ERR_CORRECTION_NO_CHANGE');

    const stockBefore = await getLatestStockSnapshot(tx, target.productId, target.variantId, accountingPeriod.id);
    const stockAfter = stockBefore + delta;
    if (stockAfter < 0) throw new Error('ERR_INSUFFICIENT_STOCK');

    return tx.stockTransaction.create({
      data: {
        type: 'adjustment',
        quantity: delta,
        stockBefore,
        stockAfter,
        note: input.note,
        productId: target.productId,
        userId: input.userId,
        ...(target.variantId && { variantId: target.variantId }),
        targetTransactionId: target.id,
        correctionType: input.correctionType,
        correctedQuantity,
        isGift: false,
        accountingPeriodId: accountingPeriod.id,
      },
      include: TRANSACTION_INCLUDE,
    });
  });

  return mapToTransactionRecord(result);
}

export async function createBatchTransactions(
  inputs: CreateTransactionInput[]
): Promise<TransactionRecord[]> {
  return prisma.$transaction(async (tx) => {
    const created: TransactionRecord[] = [];
    const accountingPeriod = await getCurrentAccountingPeriodForWrite(tx);

    for (const input of inputs) {
      if (!input.quantity || input.quantity === 0) throw new Error('ERR_INVALID_QUANTITY');
      if (input.type === 'stock_out' && !input.stockOutType) throw new Error('ERR_STOCK_OUT_TYPE_REQUIRED');
      if (input.type === 'stock_in' && input.quantity < 0) throw new Error('ERR_INVALID_QUANTITY');
      if (input.type === 'stock_out' && input.quantity > 0) throw new Error('ERR_INVALID_QUANTITY');

      if (input.variantId) {
        await validateVariantBelongsToProduct(tx, input.variantId, input.productId);
      }
      await ensureVariantProvidedIfRequired(tx, input.productId, input.variantId);

      const stockBefore = await getLatestStockSnapshot(tx, input.productId, input.variantId, accountingPeriod.id);
      const stockAfter = stockBefore + input.quantity;
      if (stockAfter < 0) throw new Error('ERR_INSUFFICIENT_STOCK');

      const row = await tx.stockTransaction.create({
        data: {
          type: input.type,
          quantity: input.quantity,
          stockBefore,
          stockAfter,
          note: input.note,
          productId: input.productId,
          userId: input.userId,
          ...(input.variantId && { variantId: input.variantId }),
          ...(input.stockOutType && { stockOutType: input.stockOutType }),
          ...(input.salePrice != null && { salePrice: input.salePrice }),
          ...(input.purchasePrice != null && { purchasePrice: input.purchasePrice }),
          isGift: input.isGift ?? false,
          accountingPeriodId: accountingPeriod.id,
          ...(input.parentTransactionId && { parentTransactionId: input.parentTransactionId }),
        },
        include: TRANSACTION_INCLUDE,
      });
      created.push(mapToTransactionRecord(row));
    }

    return created;
  });
}
