import { prisma } from '@/lib/db';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class AccountingPeriodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountingPeriodError';
  }
}

export function getDefaultNextPeriodStartAt(endAt: Date): Date {
  const nextStartAt = new Date(endAt);
  nextStartAt.setUTCDate(nextStartAt.getUTCDate() + 1);
  nextStartAt.setUTCHours(0, 0, 0, 0);
  return nextStartAt;
}

export async function getCurrentAccountingPeriod() {
  const period = await prisma.accountingPeriod.findFirst({
    where: { status: 'open' },
    orderBy: { startAt: 'desc' },
  });

  if (!period) {
    throw new AccountingPeriodError('ERR_ACCOUNTING_PERIOD_NOT_FOUND');
  }

  return period;
}

export async function getCurrentAccountingPeriodOrNull() {
  return prisma.accountingPeriod.findFirst({
    where: { status: 'open' },
    orderBy: { startAt: 'desc' },
  });
}

export async function getCurrentAccountingPeriodForWrite(tx: TransactionClient) {
  const period = await tx.accountingPeriod.findFirst({
    where: { status: 'open' },
    orderBy: { startAt: 'desc' },
    select: { id: true, startAt: true },
  });

  if (!period) {
    throw new AccountingPeriodError('ERR_ACCOUNTING_PERIOD_NOT_FOUND');
  }

  return period;
}

export async function getAccountingPeriods() {
  return prisma.accountingPeriod.findMany({
    orderBy: [{ status: 'asc' }, { startAt: 'desc' }],
  });
}

export async function getAccountingPeriodClosePreview() {
  const currentPeriod = await getCurrentAccountingPeriodOrNull();
  if (!currentPeriod) {
    return { stockItems: 0, stockQty: 0, openDebtCount: 0, openDebtAmount: 0 };
  }

  const [stockBalances, openDebtGroups] = await Promise.all([
    prisma.stockTransaction.groupBy({
      by: ['productId', 'variantId'],
      where: { accountingPeriodId: currentPeriod.id },
      _sum: { quantity: true },
    }),
    prisma.debtGroup.findMany({
      where: { status: 'open' },
      select: { totalAmount: true, paidAmount: true },
    }),
  ]);

  const positiveStockBalances = stockBalances
    .map((balance) => balance._sum.quantity ?? 0)
    .filter((qty) => qty !== 0);

  return {
    stockItems: positiveStockBalances.length,
    stockQty: positiveStockBalances.reduce((sum, qty) => sum + qty, 0),
    openDebtCount: openDebtGroups.length,
    openDebtAmount: openDebtGroups.reduce((sum, debt) => sum + debt.totalAmount - debt.paidAmount, 0),
  };
}

async function getSingleOpenPeriod(tx: TransactionClient) {
  const [period, openCount] = await Promise.all([
    tx.accountingPeriod.findFirst({
      where: { status: 'open' },
      orderBy: { startAt: 'desc' },
    }),
    tx.accountingPeriod.count({ where: { status: 'open' } }),
  ]);

  if (!period) {
    throw new AccountingPeriodError('ERR_ACCOUNTING_PERIOD_NOT_FOUND');
  }

  if (openCount !== 1) {
    throw new AccountingPeriodError('ERR_ACCOUNTING_PERIOD_STATE_INVALID');
  }

  return period;
}

function buildStockKey(productId: number, variantId: number | null): string {
  return `${productId}:${variantId ?? 'base'}`;
}

export async function closeAccountingPeriod({
  endAt,
  nextStartAt,
  userId,
}: {
  endAt: Date;
  nextStartAt: Date;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const currentPeriod = await getSingleOpenPeriod(tx);

    if (endAt < currentPeriod.startAt) {
      throw new AccountingPeriodError('ERR_PERIOD_END_BEFORE_START');
    }

    if (nextStartAt <= endAt) {
      throw new AccountingPeriodError('ERR_PERIOD_OVERLAP');
    }

    const [lateTransactionCount, lateDebtPaymentCount] = await Promise.all([
      tx.stockTransaction.count({
        where: {
          accountingPeriodId: currentPeriod.id,
          createdAt: { gt: endAt },
        },
      }),
      tx.debtPayment.count({
        where: {
          accountingPeriodId: currentPeriod.id,
          createdAt: { gt: endAt },
        },
      }),
    ]);

    if (lateTransactionCount > 0 || lateDebtPaymentCount > 0) {
      throw new AccountingPeriodError('ERR_PERIOD_HAS_LATER_RECORDS');
    }

    const [stockBalances, openDebtGroups] = await Promise.all([
      tx.stockTransaction.groupBy({
        by: ['productId', 'variantId'],
        where: { accountingPeriodId: currentPeriod.id },
        _sum: { quantity: true },
      }),
      tx.debtGroup.findMany({
        where: { status: 'open' },
        select: { id: true, totalAmount: true, paidAmount: true },
      }),
    ]);

    const closedPeriod = await tx.accountingPeriod.update({
      where: { id: currentPeriod.id },
      data: {
        endAt,
        status: 'closed',
        closedAt: new Date(),
        closedById: userId,
      },
    });

    const newPeriod = await tx.accountingPeriod.create({
      data: {
        startAt: nextStartAt,
        status: 'open',
        createdById: userId,
      },
    });

    const inventorySnapshotData = stockBalances
      .map((balance) => ({
        accountingPeriodId: newPeriod.id,
        productId: balance.productId,
        variantId: balance.variantId,
        stockKey: buildStockKey(balance.productId, balance.variantId),
        openingQty: balance._sum.quantity ?? 0,
      }))
      .filter((balance) => balance.openingQty !== 0);

    const debtSnapshotData = openDebtGroups
      .map((debtGroup) => ({
        accountingPeriodId: newPeriod.id,
        debtGroupId: debtGroup.id,
        openingRemainingAmount: debtGroup.totalAmount - debtGroup.paidAmount,
      }))
      .filter((balance) => balance.openingRemainingAmount > 0);

    if (inventorySnapshotData.length > 0) {
      await tx.periodInventoryBalance.createMany({ data: inventorySnapshotData });
    }

    if (debtSnapshotData.length > 0) {
      await tx.periodDebtBalance.createMany({ data: debtSnapshotData });
    }

    return {
      closedPeriodId: closedPeriod.id,
      newPeriodId: newPeriod.id,
      carriedStockCount: inventorySnapshotData.length,
      carriedDebtCount: debtSnapshotData.length,
    };
  });
}
