import 'server-only';
import { prisma } from '@/lib/db';
import type { DebtStatus, DebtGroupSummary, DebtGroupDetail } from './types';

export const DEBT_CACHE_TAG = 'debts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEBT_GROUP_INCLUDE = {
  payments: {
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

function mapToDebtGroupSummary(dg: {
  id: number;
  transactionId: number;
  debtorName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): DebtGroupSummary {
  return {
    id: dg.id,
    transactionId: dg.transactionId,
    debtorName: dg.debtorName,
    totalAmount: dg.totalAmount,
    paidAmount: dg.paidAmount,
    remainingAmount: dg.totalAmount - dg.paidAmount,
    status: dg.status as DebtStatus,
    createdAt: dg.createdAt,
    updatedAt: dg.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getDebtGroups(options?: {
  inventoryId?: number;
  status?: DebtStatus;
}): Promise<DebtGroupSummary[]> {
  const rows = await prisma.debtGroup.findMany({
    where: {
      ...(options?.status && { status: options.status }),
      ...(options?.inventoryId && {
        transaction: { product: { inventoryId: options.inventoryId } },
      }),
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapToDebtGroupSummary);
}

export async function getDebtGroupById(id: number): Promise<DebtGroupDetail | null> {
  const debtGroup = await prisma.debtGroup.findUnique({
    where: { id },
    include: DEBT_GROUP_INCLUDE,
  });
  if (!debtGroup) return null;

  return {
    ...mapToDebtGroupSummary(debtGroup),
    payments: debtGroup.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      note: p.note,
      userId: p.userId,
      userName: p.user.name,
      createdAt: p.createdAt,
    })),
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function addDebtPayment(
  debtGroupId: number,
  amount: number,
  note: string | undefined,
  userId: string
): Promise<DebtGroupSummary> {
  if (amount <= 0) throw new Error('ERR_INVALID_PAYMENT_AMOUNT');

  const result = await prisma.$transaction(async (tx) => {
    const debtGroup = await tx.debtGroup.findUniqueOrThrow({ where: { id: debtGroupId } });
    if (debtGroup.status !== 'open') throw new Error('ERR_DEBT_ALREADY_CLOSED');
    const remaining = debtGroup.totalAmount - debtGroup.paidAmount;
    if (amount > remaining) throw new Error('ERR_PAYMENT_EXCEEDS_REMAINING');

    await tx.debtPayment.create({ data: { debtGroupId, amount, note, userId } });

    const newPaidAmount = debtGroup.paidAmount + amount;
    const newStatus = newPaidAmount >= debtGroup.totalAmount ? 'closed' : 'open';

    return tx.debtGroup.update({
      where: { id: debtGroupId },
      data: { paidAmount: newPaidAmount, status: newStatus },
    });
  });

  return mapToDebtGroupSummary(result);
}

/**
 * Manually closes a debt.
 * Status becomes 'cancelled' if paidAmount < totalAmount (partial payment accepted),
 * or 'closed' if fully paid.
 */
export async function closeDebt(debtGroupId: number): Promise<DebtGroupSummary> {
  const debtGroup = await prisma.debtGroup.findUniqueOrThrow({ where: { id: debtGroupId } });
  if (debtGroup.status !== 'open') throw new Error('ERR_DEBT_ALREADY_CLOSED');

  const newStatus: DebtStatus = debtGroup.paidAmount >= debtGroup.totalAmount ? 'closed' : 'cancelled';
  const updated = await prisma.debtGroup.update({
    where: { id: debtGroupId },
    data: { status: newStatus },
  });

  return mapToDebtGroupSummary(updated);
}
