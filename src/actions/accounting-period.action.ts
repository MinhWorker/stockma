'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { requireUser } from '@/lib/session';
import { closeAccountingPeriod, getDefaultNextPeriodStartAt } from '@/services/accounting-period.service';
import { TRANSACTION_CACHE_TAG } from '@/services/transaction.service';
import { DEBT_CACHE_TAG } from '@/services/debt.service';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function closeAccountingPeriodAction(input: {
  endAt: string;
  nextStartAt?: string;
}): Promise<ActionResult<Awaited<ReturnType<typeof closeAccountingPeriod>>>> {
  try {
    const user = await requireUser();
    const endAt = new Date(input.endAt);
    const nextStartAt = input.nextStartAt ? new Date(input.nextStartAt) : getDefaultNextPeriodStartAt(endAt);

    if (Number.isNaN(endAt.getTime()) || Number.isNaN(nextStartAt.getTime())) {
      throw new Error('ERR_INVALID_PERIOD_DATE');
    }

    const result = await closeAccountingPeriod({ endAt, nextStartAt, userId: user.id });
    revalidateTag(TRANSACTION_CACHE_TAG, { expire: 0 });
    revalidateTag(DEBT_CACHE_TAG, { expire: 0 });
    revalidatePath('/[locale]/menu/settings', 'page');
    revalidatePath('/[locale]/menu/dashboard', 'page');
    revalidatePath('/[locale]/menu/reports', 'layout');
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
