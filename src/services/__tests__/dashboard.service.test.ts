import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    product: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    inventory: {
      count: vi.fn(),
    },
    provider: {
      count: vi.fn(),
    },
    stockTransaction: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    debtGroup: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../transaction.service', () => ({
  getTransactions: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { getTransactions } from '../transaction.service';
import { getDashboardStats } from '../dashboard.service';

const mockedPrisma = vi.mocked(prisma);
const mockedGetTransactions = vi.mocked(getTransactions);

function asMock(fn: unknown): Mock {
  return fn as Mock;
}

describe('dashboard profit calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calculates gross profit from sold item margin instead of subtracting all stock-in inventory cost', async () => {
    asMock(mockedPrisma.product.count).mockResolvedValue(1);
    asMock(mockedPrisma.inventory.count).mockResolvedValue(1);
    asMock(mockedPrisma.provider.count).mockResolvedValue(1);
    mockedGetTransactions.mockResolvedValue([]);

    asMock(mockedPrisma.stockTransaction.groupBy)
      .mockResolvedValueOnce([
        { productId: 1, _sum: { quantity: 8 } },
      ])
      .mockResolvedValueOnce([
        { productId: 1, _sum: { quantity: -2, salePrice: 300 } },
      ]);
    asMock(mockedPrisma.product.findMany)
      .mockResolvedValueOnce([
        { id: 1, costPrice: 100 },
      ])
      .mockResolvedValueOnce([
        { id: 1, name: 'Nuoc suoi' },
      ]);
    asMock(mockedPrisma.stockTransaction.findMany)
      .mockResolvedValueOnce([
        {
          id: 1,
          quantity: -2,
          salePrice: 150,
          purchasePrice: null,
          product: { costPrice: 100 },
          variant: null,
          debtGroup: null,
        },
      ])
      .mockResolvedValueOnce([
        { quantity: 10, purchasePrice: 100 },
      ])
      .mockResolvedValueOnce([]);
    asMock(mockedPrisma.debtGroup.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const stats = await getDashboardStats();

    expect(stats.totalStockValue).toBe(800);
    expect(stats.totalCost).toBe(1000);
    expect(stats.estimatedRevenue).toBe(300);
    expect(stats.estimatedGrossProfit).toBe(100);
    expect(stats.actualGrossProfit).toBe(100);
  });
});
