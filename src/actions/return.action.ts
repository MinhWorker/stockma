'use server';

import { revalidateTag } from 'next/cache';
import { createReturnTransaction, getReturnTransactions } from '@/services/return.service';
import { logActivity, ACTIVITY_CACHE_TAG } from '@/services/activity.service';
import { TRANSACTION_CACHE_TAG } from '@/services/transaction.service';
import { PRODUCT_CACHE_TAG } from '@/services/product.service';
import { withUser } from '@/lib/action';
import type { CreateReturnInput } from '@/services/types';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const createReturnAction = withUser(async (
  user,
  input: Omit<CreateReturnInput, 'userId'>
): Promise<ActionResult<import('@/services/types').ReturnRecord>> => {
  try {
    const result = await createReturnTransaction({ ...input, userId: user.id });
    await logActivity({
      action: 'create',
      entityType: 'ReturnTransaction',
      entityId: result.id,
      entityName: result.productName,
      description: `Trả hàng "${result.productName}" — hoàn ${result.returnQty}, đổi ${result.replacementQty}`,
      userId: user.id,
    });
    revalidateTag(TRANSACTION_CACHE_TAG, { expire: 0 });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export async function getReturnTransactionsAction(options?: {
  productId?: number;
  inventoryId?: number;
}) {
  return getReturnTransactions(options);
}

