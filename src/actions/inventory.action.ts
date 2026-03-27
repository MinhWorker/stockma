'use server';

import { revalidateTag } from 'next/cache';
import { createTransaction } from '@/services/transaction.service';
import { TRANSACTION_TAG } from '@/services/transaction.service';
import { PRODUCT_TAG } from '@/services/product.service';
import type { TransactionType } from '@/services/types';

export interface CreateTransactionPayload {
  type: TransactionType;
  productId: number;
  quantity: number;
  note?: string;
  userId: number;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createTransactionAction(
  payload: CreateTransactionPayload
): Promise<ActionResult> {
  try {
    await createTransaction({
      type: payload.type,
      productId: payload.productId,
      quantity:
        payload.type === 'stock_out' ? -Math.abs(payload.quantity) : Math.abs(payload.quantity),
      note: payload.note,
      userId: payload.userId,
    });
    // Transactions changed; products stockQty also affected
    revalidateTag(TRANSACTION_TAG, 'default');
    revalidateTag(PRODUCT_TAG, 'default');
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
