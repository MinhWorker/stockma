import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import type { TransactionRecord, CreateTransactionInput } from './types';

export const TRANSACTION_TAG = 'transactions';

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
  userId: number;
  user: { name: string | null };
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
    createdAt: tx.createdAt,
  };
}

const transactionInclude = {
  product: { select: { name: true } },
  user: { select: { name: true } },
} as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lay lich su giao dich, mac dinh sap xep moi nhat truoc.
 */
export const getTransactions = cache(
  unstable_cache(
    async (options?: { productId?: number; limit?: number }): Promise<TransactionRecord[]> => {
      const rows = await prisma.stockTransaction.findMany({
        where: options?.productId ? { productId: options.productId } : undefined,
        include: transactionInclude,
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
      });
      return rows.map(mapToTransactionRecord);
    },
    ['transactions'],
    { tags: [TRANSACTION_TAG] }
  )
);

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Tao mot giao dich kho moi.
 *
 * Toan bo logic duoc boc trong Prisma transaction de dam bao:
 * 1. Doc stockBefore (snapshot hien tai)
 * 2. Tinh stockAfter
 * 3. Kiem tra khong de ton kho xuong am
 * 4. Ghi StockTransaction
 *
 * Quy uoc quantity:
 * - stock_in:    quantity > 0 (nhap them vao kho)
 * - stock_out:   quantity < 0 (xuat ra khoi kho), caller truyen so am
 * - adjustment:  quantity co the am hoac duong (dieu chinh kiem ke)
 */
export async function createTransaction(input: CreateTransactionInput): Promise<TransactionRecord> {
  const result = await prisma.$transaction(async (tx) => {
    // Doc snapshot ton kho hien tai trong cung transaction de tranh race condition
    const latestSnapshot = await tx.stockTransaction.findFirst({
      where: { productId: input.productId },
      orderBy: { createdAt: 'desc' },
      select: { stockAfter: true },
    });

    const stockBefore = latestSnapshot?.stockAfter ?? 0;
    const stockAfter = stockBefore + input.quantity;

    if (stockAfter < 0) {
      throw new Error(
        `Insufficient stock for product ${input.productId}: ` +
          `current=${stockBefore}, requested=${input.quantity}`
      );
    }

    const created = await tx.stockTransaction.create({
      data: {
        type: input.type,
        quantity: input.quantity,
        stockBefore,
        stockAfter,
        note: input.note,
        productId: input.productId,
        userId: input.userId,
      },
      include: transactionInclude,
    });

    return created;
  });

  return mapToTransactionRecord(result);
}

/**
 * Tao nhieu giao dich cung luc trong mot Prisma transaction duy nhat.
 * Dung cho truong hop nhap/xuat nhieu san pham mot lan (batch operation).
 * Cac giao dich duoc xu ly tuan tu de dam bao stockBefore/stockAfter chinh xac.
 */
export async function createBatchTransactions(
  inputs: CreateTransactionInput[]
): Promise<TransactionRecord[]> {
  const results = await prisma.$transaction(async (tx) => {
    const created: TransactionRecord[] = [];

    for (const input of inputs) {
      const latestSnapshot = await tx.stockTransaction.findFirst({
        where: { productId: input.productId },
        orderBy: { createdAt: 'desc' },
        select: { stockAfter: true },
      });

      const stockBefore = latestSnapshot?.stockAfter ?? 0;
      const stockAfter = stockBefore + input.quantity;

      if (stockAfter < 0) {
        throw new Error(
          `Insufficient stock for product ${input.productId}: ` +
            `current=${stockBefore}, requested=${input.quantity}`
        );
      }

      const row = await tx.stockTransaction.create({
        data: {
          type: input.type,
          quantity: input.quantity,
          stockBefore,
          stockAfter,
          note: input.note,
          productId: input.productId,
          userId: input.userId,
        },
        include: transactionInclude,
      });

      created.push(mapToTransactionRecord(row));
    }

    return created;
  });

  return results;
}
