'use server';

import { revalidateTag } from 'next/cache';
import { createTransaction } from '@/services/transaction.service';
import { getProductById } from '@/services/product.service';
import { getAllInventories } from '@/services/inventory.service';
import { sendNotificationToAll } from '@/services/notification.service';
import { TRANSACTION_TAG } from '@/services/transaction.service';
import { PRODUCT_TAG } from '@/services/product.service';
import type { TransactionType } from '@/services/types';

export interface CreateTransactionPayload {
  type: TransactionType;
  productId: number;
  quantity: number;
  note?: string;
  userId: string;
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
    const tx = await createTransaction({
      type: payload.type,
      productId: payload.productId,
      quantity:
        payload.type === 'stock_out' ? -Math.abs(payload.quantity) : Math.abs(payload.quantity),
      note: payload.note,
      userId: payload.userId,
    });

    revalidateTag(TRANSACTION_TAG, "default");
    revalidateTag(PRODUCT_TAG, "default");

    // Fire push notifications (non-blocking)
    const product = await getProductById(payload.productId);
    if (product) {
      // New transaction notification
      sendNotificationToAll('newTransaction', {
        title: 'Giao dịch mới',
        body: `${payload.type === 'stock_in' ? 'Nhập' : payload.type === 'stock_out' ? 'Xuất' : 'Điều chỉnh'} ${Math.abs(payload.quantity)} × ${product.name}`,
        url: '/menu/inventory',
      }).catch(() => {});

      // Low stock / out of stock notifications after transaction
      if (product.status === 'out_of_stock') {
        sendNotificationToAll('stockOut', {
          title: 'Hết hàng',
          body: `${product.name} đã hết hàng`,
          url: '/menu/inventory',
        }).catch(() => {});
      } else if (product.status === 'low_stock') {
        sendNotificationToAll('lowStock', {
          title: 'Sắp hết hàng',
          body: `${product.name} còn ${product.stockQty} (mức tối thiểu: ${product.reorderLevel})`,
          url: '/menu/inventory',
        }).catch(() => {});
      }
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getInventoriesAction() {
  return getAllInventories();
}
