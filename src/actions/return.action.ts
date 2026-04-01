'use server';

import { revalidateTag } from 'next/cache';
import { createReturnTransaction, getReturnTransactions } from '@/services/return.service';
import { TRANSACTION_CACHE_TAG } from '@/services/transaction.service';
import { PRODUCT_CACHE_TAG } from '@/services/product.service';
import type { CreateReturnInput } from '@/services/types';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createReturnAction(input: CreateReturnInput): Promise<ActionResult<import('@/services/types').ReturnRecord>> {
  try {
    const result = await createReturnTransaction(input);
    revalidateTag(TRANSACTION_CACHE_TAG, 'default');
    revalidateTag(PRODUCT_CACHE_TAG, 'default');
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getReturnTransactionsAction(options?: {
  productId?: number;
  inventoryId?: number;
}) {
  return getReturnTransactions(options);
}
