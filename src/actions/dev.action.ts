'use server';

import { prisma } from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function resetAppDataAction(): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Only available in development' };
  }

  try {
    // Delete in dependency order to respect FK constraints
    await prisma.debtPayment.deleteMany();
    await prisma.debtGroup.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.stockTransaction.deleteMany();
    await prisma.returnTransaction.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();

    revalidateTag('products', { expire: 0 });
    revalidateTag('transactions', { expire: 0 });
    revalidateTag('activity', { expire: 0 });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

