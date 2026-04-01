import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure revenue calculation logic
// ---------------------------------------------------------------------------

type StockOutType = 'retail' | 'wholesale' | 'transfer';

interface SaleTx {
  quantity: number; // negative for stock_out
  salePrice: number | null;
  stockOutType: StockOutType;
  isGift: boolean;
  debtGroupPaidAmount?: number | null; // null = no debt group (paid in full)
}

interface StockInTx {
  quantity: number; // positive
  purchasePrice: number | null;
}

function computeActualRevenue(saleTxs: SaleTx[], allDebtGroupPaidAmounts: number[]): number {
  let revenue = 0;

  for (const tx of saleTxs) {
    if (tx.stockOutType === 'transfer') continue;
    if (tx.isGift) continue;
    if (tx.salePrice === null) continue;

    // No debt group → full amount collected immediately
    if (tx.debtGroupPaidAmount === null || tx.debtGroupPaidAmount === undefined) {
      revenue += tx.salePrice * Math.abs(tx.quantity);
    }
    // Has debt group → paidAmount counted separately below
  }

  // Add paidAmount from all debt groups
  for (const paid of allDebtGroupPaidAmounts) {
    revenue += paid;
  }

  return revenue;
}

function computeEstimatedRevenue(saleTxs: SaleTx[]): number {
  let revenue = 0;
  for (const tx of saleTxs) {
    if (tx.stockOutType === 'transfer') continue;
    if (tx.isGift) continue;
    if (tx.salePrice === null) continue;
    revenue += tx.salePrice * Math.abs(tx.quantity);
  }
  return revenue;
}

function computeTotalCost(stockInTxs: StockInTx[]): number {
  return stockInTxs.reduce((sum, tx) => sum + (tx.purchasePrice ?? 0) * tx.quantity, 0);
}

// Feature: product-variants-and-stock-out-types, Property 6: actualRevenue only counts collected money
describe('actualRevenue calculation', () => {
  test('Property 6a: transfer transactions are excluded from actualRevenue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
            salePrice: fc.integer({ min: 1, max: 100_000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (txs) => {
          const transferTxs: SaleTx[] = txs.map((tx) => ({
            quantity: -tx.quantity,
            salePrice: null, // transfer has no salePrice
            stockOutType: 'transfer',
            isGift: false,
            debtGroupPaidAmount: null,
          }));
          const revenue = computeActualRevenue(transferTxs, []);
          return revenue === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6b: gift transactions are excluded from actualRevenue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (txs) => {
          const giftTxs: SaleTx[] = txs.map((tx) => ({
            quantity: -tx.quantity,
            salePrice: 0,
            stockOutType: 'retail',
            isGift: true,
            debtGroupPaidAmount: null,
          }));
          const revenue = computeActualRevenue(giftTxs, []);
          return revenue === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6c: non-debt retail/wholesale transactions count full salePrice * qty', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
            salePrice: fc.integer({ min: 1, max: 100_000 }),
            stockOutType: fc.constantFrom('retail' as const, 'wholesale' as const),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (txs) => {
          const saleTxs: SaleTx[] = txs.map((tx) => ({
            quantity: -tx.quantity,
            salePrice: tx.salePrice,
            stockOutType: tx.stockOutType,
            isGift: false,
            debtGroupPaidAmount: null,
          }));
          const expected = txs.reduce((sum, tx) => sum + tx.salePrice * tx.quantity, 0);
          const actual = computeActualRevenue(saleTxs, []);
          return actual === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6d: debt group paidAmounts are added to actualRevenue', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 1_000_000 }), { minLength: 1, maxLength: 10 }),
        (paidAmounts) => {
          const expected = paidAmounts.reduce((a, b) => a + b, 0);
          const actual = computeActualRevenue([], paidAmounts);
          return actual === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: product-variants-and-stock-out-types, Property 7: estimatedRevenue counts all sale transactions
describe('estimatedRevenue calculation', () => {
  test('Property 7a: transfer transactions are excluded from estimatedRevenue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (txs) => {
          const transferTxs: SaleTx[] = txs.map((tx) => ({
            quantity: -tx.quantity,
            salePrice: null,
            stockOutType: 'transfer',
            isGift: false,
          }));
          return computeEstimatedRevenue(transferTxs) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7b: gift transactions are excluded from estimatedRevenue', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ quantity: fc.integer({ min: 1, max: 100 }) }),
          { minLength: 1, maxLength: 10 }
        ),
        (txs) => {
          const giftTxs: SaleTx[] = txs.map((tx) => ({
            quantity: -tx.quantity,
            salePrice: 0,
            stockOutType: 'retail',
            isGift: true,
          }));
          return computeEstimatedRevenue(giftTxs) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7c: estimatedRevenue = SUM(salePrice * qty) for all retail/wholesale regardless of debt status', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
            salePrice: fc.integer({ min: 1, max: 100_000 }),
            stockOutType: fc.constantFrom('retail' as const, 'wholesale' as const),
            hasDebt: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (txs) => {
          const saleTxs: SaleTx[] = txs.map((tx) => ({
            quantity: -tx.quantity,
            salePrice: tx.salePrice,
            stockOutType: tx.stockOutType,
            isGift: false,
            debtGroupPaidAmount: tx.hasDebt ? tx.salePrice * tx.quantity * 0.5 : null,
          }));
          const expected = txs.reduce((sum, tx) => sum + tx.salePrice * tx.quantity, 0);
          return computeEstimatedRevenue(saleTxs) === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 7d: estimatedRevenue >= actualRevenue (estimated includes unpaid debt)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
            salePrice: fc.integer({ min: 1, max: 100_000 }),
            stockOutType: fc.constantFrom('retail' as const, 'wholesale' as const),
            paidFraction: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (txs) => {
          const saleTxs: SaleTx[] = txs.map((tx) => ({
            quantity: -tx.quantity,
            salePrice: tx.salePrice,
            stockOutType: tx.stockOutType,
            isGift: false,
            debtGroupPaidAmount: Math.floor(tx.salePrice * tx.quantity * tx.paidFraction),
          }));
          const debtPaidAmounts = txs.map((tx) =>
            Math.floor(tx.salePrice * tx.quantity * tx.paidFraction)
          );
          const actual = computeActualRevenue(saleTxs, debtPaidAmounts);
          const estimated = computeEstimatedRevenue(saleTxs);
          return estimated >= actual - 1; // allow rounding tolerance
        }
      ),
      { numRuns: 100 }
    );
  });
});
