import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    accountingPeriod: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    stockTransaction: {
      aggregate: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      groupBy: vi.fn(),
    },
    returnTransaction: {
      aggregate: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    debtPayment: {
      aggregate: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    debtGroup: {
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import {
  backfillInitialAccountingPeriod,
  collectAccountingPeriodRolloutSnapshot,
} from '../accounting-period-rollout.service';

const mockedPrisma = vi.mocked(prisma);

function asMock(fn: unknown): Mock {
  return fn as Mock;
}

describe('accounting period production rollout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(mockedPrisma.$transaction).mockImplementation((fn) => fn(mockedPrisma));
  });

  test('creates the first accounting period from the earliest production transaction', async () => {
    asMock(mockedPrisma.accountingPeriod.count).mockResolvedValue(0);
    asMock(mockedPrisma.accountingPeriod.findFirst).mockResolvedValue(null);
    asMock(mockedPrisma.stockTransaction.aggregate).mockResolvedValue({ _min: { createdAt: new Date('2026-01-03T02:00:00.000Z') } });
    asMock(mockedPrisma.returnTransaction.aggregate).mockResolvedValue({ _min: { createdAt: new Date('2026-01-02T01:00:00.000Z') } });
    asMock(mockedPrisma.debtPayment.aggregate).mockResolvedValue({ _min: { createdAt: null } });
    asMock(mockedPrisma.accountingPeriod.create).mockResolvedValue({ id: 7, startAt: new Date('2026-01-02T01:00:00.000Z') });
    asMock(mockedPrisma.stockTransaction.updateMany).mockResolvedValue({ count: 3 });
    asMock(mockedPrisma.returnTransaction.updateMany).mockResolvedValue({ count: 1 });
    asMock(mockedPrisma.debtPayment.updateMany).mockResolvedValue({ count: 2 });
    asMock(mockedPrisma.debtGroup.findMany).mockResolvedValue([]);
    asMock(mockedPrisma.stockTransaction.count).mockResolvedValue(0);
    asMock(mockedPrisma.returnTransaction.count).mockResolvedValue(0);
    asMock(mockedPrisma.debtPayment.count).mockResolvedValue(0);

    const result = await backfillInitialAccountingPeriod({ now: new Date('2026-05-24T00:00:00.000Z') });

    expect(mockedPrisma.accountingPeriod.create).toHaveBeenCalledWith({
      data: {
        name: 'Kỳ kế toán đầu tiên',
        startAt: new Date('2026-01-02T01:00:00.000Z'),
        status: 'open',
      },
    });
    expect(result.accountingPeriodId).toBe(7);
    expect(result.stockTransactionsUpdated).toBe(3);
  });

  test('backfills initial paid amount from total paid minus debt payments', async () => {
    asMock(mockedPrisma.accountingPeriod.count).mockResolvedValue(1);
    asMock(mockedPrisma.accountingPeriod.findFirst).mockResolvedValue({ id: 9, startAt: new Date('2026-01-01T00:00:00.000Z') });
    asMock(mockedPrisma.stockTransaction.updateMany).mockResolvedValue({ count: 0 });
    asMock(mockedPrisma.returnTransaction.updateMany).mockResolvedValue({ count: 0 });
    asMock(mockedPrisma.debtPayment.updateMany).mockResolvedValue({ count: 0 });
    asMock(mockedPrisma.debtGroup.findMany).mockResolvedValue([
      { id: 10, paidAmount: 500_000, initialPaidAmount: 0, payments: [{ amount: 200_000 }, { amount: 50_000 }] },
      { id: 11, paidAmount: 100_000, initialPaidAmount: 100_000, payments: [] },
    ]);
    asMock(mockedPrisma.debtGroup.update).mockResolvedValue({});
    asMock(mockedPrisma.stockTransaction.count).mockResolvedValue(0);
    asMock(mockedPrisma.returnTransaction.count).mockResolvedValue(0);
    asMock(mockedPrisma.debtPayment.count).mockResolvedValue(0);

    const result = await backfillInitialAccountingPeriod();

    expect(mockedPrisma.debtGroup.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { initialPaidAmount: 250_000 },
    });
    expect(mockedPrisma.debtGroup.update).toHaveBeenCalledTimes(1);
    expect(result.debtGroupsUpdated).toBe(1);
  });

  test('fails before writing when production has multiple open periods', async () => {
    asMock(mockedPrisma.accountingPeriod.count).mockResolvedValue(2);

    await expect(backfillInitialAccountingPeriod()).rejects.toThrow('ERR_MULTIPLE_OPEN_PERIODS');
    expect(mockedPrisma.stockTransaction.updateMany).not.toHaveBeenCalled();
  });

  test('produces a read-only audit snapshot with stock and debt hashes', async () => {
    asMock(mockedPrisma.accountingPeriod.count)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    asMock(mockedPrisma.stockTransaction.count)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(0);
    asMock(mockedPrisma.returnTransaction.count)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    asMock(mockedPrisma.debtPayment.count)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    asMock(mockedPrisma.debtGroup.count).mockResolvedValue(2);
    asMock(mockedPrisma.stockTransaction.aggregate).mockResolvedValue({ _min: { createdAt: new Date('2026-01-01T00:00:00.000Z') } });
    asMock(mockedPrisma.returnTransaction.aggregate).mockResolvedValue({ _min: { createdAt: null } });
    asMock(mockedPrisma.debtPayment.aggregate).mockResolvedValue({ _min: { createdAt: null } });
    asMock(mockedPrisma.stockTransaction.groupBy).mockResolvedValue([
      { productId: 1, variantId: null, _sum: { quantity: 5 } },
    ]);
    asMock(mockedPrisma.debtGroup.findMany).mockResolvedValue([
      { id: 1, totalAmount: 500_000, paidAmount: 200_000, status: 'open' },
    ]);

    const snapshot = await collectAccountingPeriodRolloutSnapshot();

    expect(snapshot.counts.stockTransactions).toBe(4);
    expect(snapshot.nullAccountingPeriodRefs.stockTransactions).toBe(0);
    expect(snapshot.stockPositionHash).toHaveLength(64);
    expect(snapshot.openDebtAmount).toBe(300_000);
  });

  test('preflight treats missing period schema as legacy data before migration', async () => {
    const missingColumn = Object.assign(new Error('column "accountingPeriodId" does not exist'), { code: 'P2022' });
    const missingTable = Object.assign(new Error('table "AccountingPeriod" does not exist'), { code: 'P2021' });

    asMock(mockedPrisma.accountingPeriod.count).mockRejectedValue(missingTable);
    asMock(mockedPrisma.stockTransaction.count)
      .mockResolvedValueOnce(4)
      .mockRejectedValueOnce(missingColumn);
    asMock(mockedPrisma.returnTransaction.count)
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(missingColumn);
    asMock(mockedPrisma.debtPayment.count)
      .mockResolvedValueOnce(2)
      .mockRejectedValueOnce(missingColumn);
    asMock(mockedPrisma.debtGroup.count).mockResolvedValue(0);
    asMock(mockedPrisma.stockTransaction.aggregate).mockResolvedValue({ _min: { createdAt: null } });
    asMock(mockedPrisma.returnTransaction.aggregate).mockResolvedValue({ _min: { createdAt: null } });
    asMock(mockedPrisma.debtPayment.aggregate).mockResolvedValue({ _min: { createdAt: null } });
    asMock(mockedPrisma.stockTransaction.groupBy).mockResolvedValue([]);
    asMock(mockedPrisma.debtGroup.findMany).mockResolvedValue([]);

    const snapshot = await collectAccountingPeriodRolloutSnapshot();

    expect(snapshot.counts.accountingPeriods).toBe(0);
    expect(snapshot.counts.openAccountingPeriods).toBe(0);
    expect(snapshot.nullAccountingPeriodRefs.stockTransactions).toBe(4);
    expect(snapshot.nullAccountingPeriodRefs.returnTransactions).toBe(1);
    expect(snapshot.nullAccountingPeriodRefs.debtPayments).toBe(2);
  });
});
