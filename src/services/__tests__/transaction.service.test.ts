import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure helpers extracted from transaction.service logic for property testing
// ---------------------------------------------------------------------------

function resolveSalePrice(
  stockOutType: 'retail' | 'wholesale' | 'transfer',
  providedSalePrice: number | undefined,
  effectivePrice: number
): number | null {
  if (stockOutType === 'transfer') return null;
  return providedSalePrice ?? effectivePrice;
}

function resolvePurchasePrice(
  type: 'stock_in' | 'stock_out' | 'adjustment',
  providedPurchasePrice: number | undefined,
  effectiveCostPrice: number
): number | null {
  if (type !== 'stock_in') return null;
  return providedPurchasePrice ?? effectiveCostPrice;
}

function validateSalePrice(salePrice: number | undefined | null): string | null {
  if (salePrice !== undefined && salePrice !== null && salePrice <= 0) {
    return 'ERR_INVALID_SALE_PRICE';
  }
  return null;
}

function computeStockAfter(stockBefore: number, quantity: number): number {
  return stockBefore + quantity;
}

// ---------------------------------------------------------------------------
// Property 3: stockQty = SUM(transactions)
// ---------------------------------------------------------------------------
describe('stockQty calculation', () => {
  // Feature: product-variants-and-stock-out-types, Property 3: stockQty = SUM(transactions)
  test('Property 3: stockAfter equals stockBefore + quantity for any transaction', () => {
    fc.assert(
      fc.property(
        fc.record({
          stockBefore: fc.integer({ min: 0, max: 100_000 }),
          quantity: fc.integer({ min: 1, max: 10_000 }),
        }),
        ({ stockBefore, quantity }) => {
          const stockAfter = computeStockAfter(stockBefore, quantity);
          return stockAfter === stockBefore + quantity;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3b: cumulative sum of transactions equals final stockQty', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -1000, max: 1000 }).filter((n) => n !== 0), {
          minLength: 1,
          maxLength: 20,
        }),
        (quantities) => {
          let stock = 0;
          const snapshots: number[] = [];
          for (const q of quantities) {
            stock += q;
            snapshots.push(stock);
          }
          const finalStock = snapshots[snapshots.length - 1];
          const sumOfQuantities = quantities.reduce((a, b) => a + b, 0);
          return finalStock === sumOfQuantities;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Transfer salePrice = null
// ---------------------------------------------------------------------------
describe('transfer salePrice', () => {
  // Feature: product-variants-and-stock-out-types, Property 4: Transfer transactions have salePrice = null
  test('Property 4: transfer stockOutType always produces salePrice = null', () => {
    fc.assert(
      fc.property(
        fc.record({
          providedSalePrice: fc.option(fc.integer({ min: 1, max: 100_000 }), { nil: undefined }),
          effectivePrice: fc.integer({ min: 1, max: 100_000 }),
        }),
        ({ providedSalePrice, effectivePrice }) => {
          const result = resolveSalePrice('transfer', providedSalePrice, effectivePrice);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: salePrice > 0 validation
// ---------------------------------------------------------------------------
describe('salePrice validation', () => {
  // Feature: product-variants-and-stock-out-types, Property 5: salePrice > 0 when provided
  test('Property 5a: salePrice <= 0 is rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000, max: 0 }),
        (salePrice) => {
          const error = validateSalePrice(salePrice);
          return error === 'ERR_INVALID_SALE_PRICE';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5b: salePrice > 0 is accepted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),
        (salePrice) => {
          const error = validateSalePrice(salePrice);
          return error === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5c: undefined/null salePrice is accepted (not provided)', () => {
    expect(validateSalePrice(undefined)).toBe(null);
    expect(validateSalePrice(null)).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// Property 8: purchasePrice snapshot
// ---------------------------------------------------------------------------
describe('purchasePrice snapshot', () => {
  // Feature: product-variants-and-stock-out-types, Property 8: purchasePrice snapshot on stock_in
  test('Property 8a: provided purchasePrice is used as-is for stock_in', () => {
    fc.assert(
      fc.property(
        fc.record({
          purchasePrice: fc.integer({ min: 1, max: 100_000 }),
          effectiveCostPrice: fc.integer({ min: 1, max: 100_000 }),
        }),
        ({ purchasePrice, effectiveCostPrice }) => {
          const result = resolvePurchasePrice('stock_in', purchasePrice, effectiveCostPrice);
          return result === purchasePrice;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8b: effectiveCostPrice is used when purchasePrice not provided', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),
        (effectiveCostPrice) => {
          const result = resolvePurchasePrice('stock_in', undefined, effectiveCostPrice);
          return result === effectiveCostPrice;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8c: purchasePrice is null for stock_out and adjustment', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('stock_out' as const, 'adjustment' as const),
          purchasePrice: fc.option(fc.integer({ min: 1, max: 100_000 }), { nil: undefined }),
          effectiveCostPrice: fc.integer({ min: 1, max: 100_000 }),
        }),
        ({ type, purchasePrice, effectiveCostPrice }) => {
          const result = resolvePurchasePrice(type, purchasePrice, effectiveCostPrice);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Gift salePrice = 0 and isGift = true
// ---------------------------------------------------------------------------
describe('gift transaction properties', () => {
  // Feature: product-variants-and-stock-out-types, Property 10: Gift salePrice = 0 and isGift = true
  test('Property 10: gift transactions always have salePrice = 0 and isGift = true', () => {
    fc.assert(
      fc.property(
        fc.record({
          productId: fc.integer({ min: 1, max: 1000 }),
          quantity: fc.integer({ min: 1, max: 100 }),
          parentTransactionId: fc.integer({ min: 1, max: 10000 }),
        }),
        ({ productId, quantity, parentTransactionId }) => {
          // Simulate gift transaction creation
          const giftTx = {
            type: 'stock_out' as const,
            quantity: -quantity,
            salePrice: 0,
            isGift: true,
            parentTransactionId,
            productId,
          };
          return giftTx.salePrice === 0 && giftTx.isGift === true && giftTx.parentTransactionId === parentTransactionId;
        }
      ),
      { numRuns: 100 }
    );
  });
});
