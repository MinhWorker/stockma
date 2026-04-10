'use server';

import { revalidateTag } from 'next/cache';
import { getDebtGroups, getDebtGroupById, addDebtPayment, closeDebt } from '@/services/debt.service';
import { DEBT_CACHE_TAG } from '@/services/debt.service';
import type { DebtStatus } from '@/services/types';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getDebtGroupsAction(options?: {
  inventoryId?: number;
  status?: DebtStatus;
}) {
  return getDebtGroups(options);
}

export async function getDebtGroupByIdAction(id: number) {
  return getDebtGroupById(id);
}

export async function addPaymentAction(
  debtGroupId: number,
  amount: number,
  note: string | undefined,
  userId: string
): Promise<ActionResult<import('@/services/types').DebtGroupSummary>> {
  try {
    const result = await addDebtPayment(debtGroupId, amount, note, userId);
    revalidateTag(DEBT_CACHE_TAG, { expire: 0 });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function closeDebtAction(
  debtGroupId: number
): Promise<ActionResult<import('@/services/types').DebtGroupSummary>> {
  try {
    const result = await closeDebt(debtGroupId);
    revalidateTag(DEBT_CACHE_TAG, { expire: 0 });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

