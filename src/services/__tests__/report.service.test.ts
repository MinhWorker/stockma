import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
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

import { prisma } from '@/lib/db';
import { getOverviewReport } from '../report.service';

const mockedPrisma = vi.mocked(prisma);

function asMock(fn: unknown): Mock {
  return fn as Mock;
}

describe('overview report profit calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calculates gross profit from sold item margin instead of subtracting all stock-in inventory cost', async () => {
    asMock(mockedPrisma.product.findMany).mockResolvedValue([
      { id: 1, costPrice: 100 },
    ]);
    asMock(mockedPrisma.stockTransaction.groupBy)
      .mockResolvedValueOnce([
        { productId: 1, _sum: { quantity: 8 } },
      ])
      .mockResolvedValueOnce([
        { type: 'stock_in', _sum: { quantity: 10 }, _count: { id: 1 } },
        { type: 'stock_out', _sum: { quantity: -2 }, _count: { id: 1 } },
      ]);
    asMock(mockedPrisma.stockTransaction.findMany)
      .mockResolvedValueOnce([
        {
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
      ]);
    asMock(mockedPrisma.debtGroup.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const report = await getOverviewReport({});

    expect(report.totalStockValue).toBe(800);
    expect(report.totalCost).toBe(1000);
    expect(report.estimatedRevenue).toBe(300);
    expect(report.estimatedGrossProfit).toBe(100);
    expect(report.actualGrossProfit).toBe(100);
  });
});
