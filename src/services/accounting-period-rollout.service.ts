import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

type RolloutDb = TransactionClient & {
  $transaction?: typeof prisma.$transaction;
};

type BackfillOptions = {
  now?: Date;
  db?: RolloutDb;
};

export type AccountingPeriodRolloutSnapshot = {
  capturedAt: string;
  earliestActivityAt: string | null;
  counts: {
    accountingPeriods: number;
    openAccountingPeriods: number;
    stockTransactions: number;
    returnTransactions: number;
    debtPayments: number;
    debtGroups: number;
  };
  nullAccountingPeriodRefs: {
    stockTransactions: number;
    returnTransactions: number;
    debtPayments: number;
  };
  stockPositionHash: string;
  openDebtAmount: number;
  openDebtHash: string;
};

export type AccountingPeriodBackfillResult = {
  accountingPeriodId: number;
  accountingPeriodStartAt: string;
  createdAccountingPeriod: boolean;
  stockTransactionsUpdated: number;
  returnTransactionsUpdated: number;
  debtPaymentsUpdated: number;
  debtGroupsUpdated: number;
};

function hashRows(rows: unknown[]): string {
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}

async function getEarliestActivityAt(db: TransactionClient, fallback: Date): Promise<Date> {
  const [stock, returns, debtPayments] = await Promise.all([
    db.stockTransaction.aggregate({ _min: { createdAt: true } }),
    db.returnTransaction.aggregate({ _min: { createdAt: true } }),
    db.debtPayment.aggregate({ _min: { createdAt: true } }),
  ]);

  const dates = [
    stock._min.createdAt,
    returns._min.createdAt,
    debtPayments._min.createdAt,
  ].filter((date): date is Date => Boolean(date));

  if (dates.length === 0) return fallback;
  return new Date(Math.min(...dates.map((date) => date.getTime())));
}

function isMissingPeriodSchemaError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  return code === 'P2021' ||
    code === 'P2022' ||
    error.message.includes('does not exist') ||
    error.message.includes('Unknown arg `accountingPeriodId`');
}

async function getOrCreateInitialPeriod(
  tx: TransactionClient,
  now: Date
): Promise<{ id: number; startAt: Date; created: boolean }> {
  const openPeriods = await tx.accountingPeriod.count({ where: { status: 'open' } });
  if (openPeriods > 1) {
    throw new Error('ERR_MULTIPLE_OPEN_PERIODS');
  }

  const existingPeriod = await tx.accountingPeriod.findFirst({
    where: { status: 'open' },
    orderBy: { startAt: 'asc' },
    select: { id: true, startAt: true },
  });

  if (existingPeriod) {
    return { ...existingPeriod, created: false };
  }

  const startAt = await getEarliestActivityAt(tx, now);
  const period = await tx.accountingPeriod.create({
    data: {
      name: 'Kỳ kế toán đầu tiên',
      startAt,
      status: 'open',
    },
  });

  return { id: period.id, startAt: period.startAt, created: true };
}

async function updateInitialPaidAmounts(tx: TransactionClient): Promise<number> {
  const debtGroups = await tx.debtGroup.findMany({
    select: {
      id: true,
      paidAmount: true,
      initialPaidAmount: true,
      payments: { select: { amount: true } },
    },
  });

  let updatedCount = 0;
  for (const debtGroup of debtGroups) {
    const paymentTotal = debtGroup.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const initialPaidAmount = Math.max(debtGroup.paidAmount - paymentTotal, 0);
    if (initialPaidAmount === debtGroup.initialPaidAmount) continue;

    await tx.debtGroup.update({
      where: { id: debtGroup.id },
      data: { initialPaidAmount },
    });
    updatedCount += 1;
  }

  return updatedCount;
}

async function countNullPeriodRefs(
  db: TransactionClient,
  totals?: {
    stockTransactions: number;
    returnTransactions: number;
    debtPayments: number;
  }
) {
  const [stockTransactionTotal, returnTransactionTotal, debtPaymentTotal] = totals
    ? [totals.stockTransactions, totals.returnTransactions, totals.debtPayments]
    : await Promise.all([
        db.stockTransaction.count(),
        db.returnTransaction.count(),
        db.debtPayment.count(),
      ]);

  const [stockTransactions, returnTransactions, debtPayments] = await Promise.all([
    db.stockTransaction.count({ where: { accountingPeriodId: null } })
      .catch((error) => {
        if (isMissingPeriodSchemaError(error)) return stockTransactionTotal;
        throw error;
      }),
    db.returnTransaction.count({ where: { accountingPeriodId: null } })
      .catch((error) => {
        if (isMissingPeriodSchemaError(error)) return returnTransactionTotal;
        throw error;
      }),
    db.debtPayment.count({ where: { accountingPeriodId: null } })
      .catch((error) => {
        if (isMissingPeriodSchemaError(error)) return debtPaymentTotal;
        throw error;
      }),
  ]);

  return { stockTransactions, returnTransactions, debtPayments };
}

export async function backfillInitialAccountingPeriod(
  options: BackfillOptions = {}
): Promise<AccountingPeriodBackfillResult> {
  const db = options.db ?? prisma;
  const now = options.now ?? new Date();
  const run = async (tx: TransactionClient) => {
    const period = await getOrCreateInitialPeriod(tx, now);

    const [stockUpdate, returnUpdate, debtPaymentUpdate, debtGroupsUpdated] = await Promise.all([
      tx.stockTransaction.updateMany({
        where: { accountingPeriodId: null },
        data: { accountingPeriodId: period.id },
      }),
      tx.returnTransaction.updateMany({
        where: { accountingPeriodId: null },
        data: { accountingPeriodId: period.id },
      }),
      tx.debtPayment.updateMany({
        where: { accountingPeriodId: null },
        data: { accountingPeriodId: period.id },
      }),
      updateInitialPaidAmounts(tx),
    ]);

    const remainingNullRefs = await countNullPeriodRefs(tx);
    if (
      remainingNullRefs.stockTransactions > 0 ||
      remainingNullRefs.returnTransactions > 0 ||
      remainingNullRefs.debtPayments > 0
    ) {
      throw new Error('ERR_BACKFILL_INCOMPLETE');
    }

    return {
      accountingPeriodId: period.id,
      accountingPeriodStartAt: period.startAt.toISOString(),
      createdAccountingPeriod: period.created,
      stockTransactionsUpdated: stockUpdate.count,
      returnTransactionsUpdated: returnUpdate.count,
      debtPaymentsUpdated: debtPaymentUpdate.count,
      debtGroupsUpdated,
    };
  };

  if (db.$transaction) {
    return db.$transaction(run);
  }

  return run(db);
}

export async function collectAccountingPeriodRolloutSnapshot(
  db: TransactionClient = prisma
): Promise<AccountingPeriodRolloutSnapshot> {
  const [accountingPeriods, openAccountingPeriods] = await Promise.all([
    db.accountingPeriod.count().catch((error) => {
      if (isMissingPeriodSchemaError(error)) return 0;
      throw error;
    }),
    db.accountingPeriod.count({ where: { status: 'open' } }).catch((error) => {
      if (isMissingPeriodSchemaError(error)) return 0;
      throw error;
    }),
  ]);

  const [
    stockTransactions,
    returnTransactions,
    debtPayments,
    debtGroups,
    earliestActivityAt,
    stockPositions,
    openDebtGroups,
  ] = await Promise.all([
    db.stockTransaction.count(),
    db.returnTransaction.count(),
    db.debtPayment.count(),
    db.debtGroup.count(),
    getEarliestActivityAt(db, new Date()),
    db.stockTransaction.groupBy({
      by: ['productId', 'variantId'],
      _sum: { quantity: true },
      orderBy: [{ productId: 'asc' }, { variantId: 'asc' }],
    }),
    db.debtGroup.findMany({
      where: { status: 'open' },
      select: { id: true, totalAmount: true, paidAmount: true, status: true },
      orderBy: { id: 'asc' },
    }),
  ]);

  const nullAccountingPeriodRefs = await countNullPeriodRefs(db, {
    stockTransactions,
    returnTransactions,
    debtPayments,
  });

  const normalizedStockPositions = stockPositions.map((row) => ({
    productId: row.productId,
    variantId: row.variantId,
    quantity: row._sum.quantity ?? 0,
  }));
  const normalizedDebtRows = openDebtGroups.map((row) => ({
    id: row.id,
    remainingAmount: row.totalAmount - row.paidAmount,
  }));

  return {
    capturedAt: new Date().toISOString(),
    earliestActivityAt: earliestActivityAt.toISOString(),
    counts: {
      accountingPeriods,
      openAccountingPeriods,
      stockTransactions,
      returnTransactions,
      debtPayments,
      debtGroups,
    },
    nullAccountingPeriodRefs,
    stockPositionHash: hashRows(normalizedStockPositions),
    openDebtAmount: normalizedDebtRows.reduce((sum, row) => sum + row.remainingAmount, 0),
    openDebtHash: hashRows(normalizedDebtRows),
  };
}

export function compareAccountingPeriodRolloutSnapshots(
  before: AccountingPeriodRolloutSnapshot,
  after: AccountingPeriodRolloutSnapshot
) {
  const errors: string[] = [];

  if (after.counts.openAccountingPeriods !== 1) {
    errors.push('ERR_EXPECTED_SINGLE_OPEN_PERIOD');
  }

  if (
    after.nullAccountingPeriodRefs.stockTransactions !== 0 ||
    after.nullAccountingPeriodRefs.returnTransactions !== 0 ||
    after.nullAccountingPeriodRefs.debtPayments !== 0
  ) {
    errors.push('ERR_PERIOD_REFS_REMAIN_NULL');
  }

  if (before.stockPositionHash !== after.stockPositionHash) {
    errors.push('ERR_STOCK_POSITION_CHANGED');
  }

  if (before.openDebtAmount !== after.openDebtAmount || before.openDebtHash !== after.openDebtHash) {
    errors.push('ERR_OPEN_DEBT_CHANGED');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

const accountingPeriodRolloutService = {
  backfillInitialAccountingPeriod,
  collectAccountingPeriodRolloutSnapshot,
  compareAccountingPeriodRolloutSnapshots,
};

export default accountingPeriodRolloutService;
