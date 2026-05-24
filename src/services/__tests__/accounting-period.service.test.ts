import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    accountingPeriod: {
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    stockTransaction: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    debtPayment: {
      count: vi.fn(),
    },
    debtGroup: {
      findMany: vi.fn(),
    },
    periodInventoryBalance: {
      createMany: vi.fn(),
    },
    periodDebtBalance: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import {
  closeAccountingPeriod,
  getDefaultNextPeriodStartAt,
  getCurrentAccountingPeriod,
} from '../accounting-period.service';

const mockedPrisma = vi.mocked(prisma);

function asMock(fn: unknown): Mock {
  return fn as Mock;
}

const activePeriod = {
  id: 1,
  name: 'Ky hien tai',
  startAt: new Date('2026-05-01T00:00:00.000Z'),
  endAt: null,
  status: 'open',
  closedAt: null,
  createdById: null,
  closedById: null,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
};

describe('accounting periods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(mockedPrisma.$transaction).mockImplementation((fn) => fn(mockedPrisma));
  });

  test('loads the single open accounting period', async () => {
    asMock(mockedPrisma.accountingPeriod.findFirst).mockResolvedValue(activePeriod);

    await expect(getCurrentAccountingPeriod()).resolves.toMatchObject({ id: 1, status: 'open' });
  });

  test('defaults the next period start to midnight on the day after close', () => {
    const closeAt = new Date('2026-05-24T15:30:00.000Z');

    expect(getDefaultNextPeriodStartAt(closeAt).toISOString()).toBe('2026-05-25T00:00:00.000Z');
  });

  test('allows opening a new period on the same day when the time is after the close time', async () => {
    asMock(mockedPrisma.accountingPeriod.findFirst).mockResolvedValue(activePeriod);
    asMock(mockedPrisma.accountingPeriod.count).mockResolvedValue(1);
    asMock(mockedPrisma.stockTransaction.count).mockResolvedValue(0);
    asMock(mockedPrisma.debtPayment.count).mockResolvedValue(0);
    asMock(mockedPrisma.stockTransaction.groupBy).mockResolvedValue([
      { productId: 1, variantId: null, _sum: { quantity: 12 } },
    ]);
    asMock(mockedPrisma.debtGroup.findMany).mockResolvedValue([
      { id: 10, totalAmount: 500_000, paidAmount: 200_000 },
    ]);
    asMock(mockedPrisma.accountingPeriod.update).mockResolvedValue({ ...activePeriod, status: 'closed' });
    asMock(mockedPrisma.accountingPeriod.create).mockResolvedValue({
      ...activePeriod,
      id: 2,
      startAt: new Date('2026-05-24T16:00:00.000Z'),
    });
    asMock(mockedPrisma.periodInventoryBalance.createMany).mockResolvedValue({ count: 1 });
    asMock(mockedPrisma.periodDebtBalance.createMany).mockResolvedValue({ count: 1 });

    const result = await closeAccountingPeriod({
      endAt: new Date('2026-05-24T15:30:00.000Z'),
      nextStartAt: new Date('2026-05-24T16:00:00.000Z'),
      userId: 'user-1',
    });

    expect(result.closedPeriodId).toBe(1);
    expect(result.newPeriodId).toBe(2);
    expect(mockedPrisma.periodInventoryBalance.createMany).toHaveBeenCalledWith({
      data: [
        {
          accountingPeriodId: 2,
          productId: 1,
          variantId: null,
          stockKey: '1:base',
          openingQty: 12,
        },
      ],
    });
    expect(mockedPrisma.periodDebtBalance.createMany).toHaveBeenCalledWith({
      data: [
        {
          accountingPeriodId: 2,
          debtGroupId: 10,
          openingRemainingAmount: 300_000,
        },
      ],
    });
  });

  test('rejects a next period start that overlaps the closed period', async () => {
    asMock(mockedPrisma.accountingPeriod.findFirst).mockResolvedValue(activePeriod);
    asMock(mockedPrisma.accountingPeriod.count).mockResolvedValue(1);

    await expect(closeAccountingPeriod({
      endAt: new Date('2026-05-24T15:30:00.000Z'),
      nextStartAt: new Date('2026-05-24T15:30:00.000Z'),
      userId: 'user-1',
    })).rejects.toThrow('ERR_PERIOD_OVERLAP');
  });

  test('rejects closing before active period start', async () => {
    asMock(mockedPrisma.accountingPeriod.findFirst).mockResolvedValue(activePeriod);
    asMock(mockedPrisma.accountingPeriod.count).mockResolvedValue(1);

    await expect(closeAccountingPeriod({
      endAt: new Date('2026-04-30T23:59:59.000Z'),
      nextStartAt: new Date('2026-05-01T00:00:00.000Z'),
      userId: 'user-1',
    })).rejects.toThrow('ERR_PERIOD_END_BEFORE_START');
  });

  test('rejects closing when active-period records exist after the selected close time', async () => {
    asMock(mockedPrisma.accountingPeriod.findFirst).mockResolvedValue(activePeriod);
    asMock(mockedPrisma.accountingPeriod.count).mockResolvedValue(1);
    asMock(mockedPrisma.stockTransaction.count).mockResolvedValue(1);

    await expect(closeAccountingPeriod({
      endAt: new Date('2026-05-24T15:30:00.000Z'),
      nextStartAt: new Date('2026-05-25T00:00:00.000Z'),
      userId: 'user-1',
    })).rejects.toThrow('ERR_PERIOD_HAS_LATER_RECORDS');
  });
});
