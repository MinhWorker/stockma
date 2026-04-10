'use server';

import { revalidateTag } from 'next/cache';
import { createTransaction, createStockOutWithGifts } from '@/services/transaction.service';
import { getProductById } from '@/services/product.service';
import { getAllInventories } from '@/services/inventory.service';
import { sendNotificationToAll } from '@/services/notification.service';
import { TRANSACTION_CACHE_TAG } from '@/services/transaction.service';
import { PRODUCT_CACHE_TAG } from '@/services/product.service';
import type {
  TransactionType,
  StockOutType,
  GiftItemInput,
} from '@/services/types';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  productId: number;
  quantity: number;
  note?: string;
  userId: string;
  variantId?: number;
  purchasePrice?: number;
}

export interface CreateStockOutPayload {
  productId: number;
  quantity: number;
  note?: string;
  userId: string;
  stockOutType: StockOutType;
  variantId?: number;
  salePrice?: number;
  gifts?: GiftItemInput[];
  debtorName?: string;
  paidAmount?: number;
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
      variantId: payload.variantId,
      purchasePrice: payload.purchasePrice,
      stockOutType: payload.type === 'stock_out' ? 'transfer' : undefined,
    });

    revalidateTag(TRANSACTION_CACHE_TAG, { expire: 0 });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });

    // Fire push notifications (non-blocking)
    const product = await getProductById(payload.productId);
    if (product) {
      sendNotificationToAll('newTransaction', {
        title: 'Giao dịch mới',
        body: `${payload.type === 'stock_in' ? 'Nhập' : payload.type === 'stock_out' ? 'Xuất' : 'Điều chỉnh'} ${Math.abs(payload.quantity)} × ${product.name}`,
        url: '/menu/inventory',
      }).catch(() => {});

      if (product.status === 'out_of_stock') {
        sendNotificationToAll('stockOut', {
          title: 'Hết hàng',
          body: `${product.name} đã hết hàng`,
          url: '/menu/inventory',
        }).catch(() => {});
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function createStockOutAction(
  payload: CreateStockOutPayload
): Promise<ActionResult<import('@/services/transaction.service').StockOutResult>> {
  try {
    const result = await createStockOutWithGifts({
      type: 'stock_out',
      productId: payload.productId,
      quantity: -Math.abs(payload.quantity),
      note: payload.note,
      userId: payload.userId,
      stockOutType: payload.stockOutType,
      variantId: payload.variantId,
      salePrice: payload.salePrice,
      gifts: payload.gifts,
      debtorName: payload.debtorName,
      paidAmount: payload.paidAmount,
    });

    revalidateTag(TRANSACTION_CACHE_TAG, { expire: 0 });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getInventoriesAction() {
  return getAllInventories();
}

