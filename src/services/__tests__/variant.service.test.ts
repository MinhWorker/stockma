import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { resolveEffectivePrices } from '../variant.service';

// Feature: product-variants-and-stock-out-types, Property 1: Effective price/unit resolution
describe('resolveEffectivePrices', () => {
  test('Property 1a: effectiveCostPrice uses variant.costPrice when set', () => {
    fc.assert(
      fc.property(
        fc.record({
          productCostPrice: fc.integer({ min: 1, max: 1_000_000 }),
          productPrice: fc.integer({ min: 1, max: 1_000_000 }),
          variantCostPrice: fc.integer({ min: 1, max: 1_000_000 }),
        }),
        ({ productCostPrice, productPrice, variantCostPrice }) => {
          const result = resolveEffectivePrices(
            { costPrice: productCostPrice, price: productPrice, unit: null },
            { costPrice: variantCostPrice, price: null, unit: null }
          );
          return result.effectiveCostPrice === variantCostPrice;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1b: effectiveCostPrice falls back to product.costPrice when variant has none', () => {
    fc.assert(
      fc.property(
        fc.record({
          productCostPrice: fc.integer({ min: 1, max: 1_000_000 }),
          productPrice: fc.integer({ min: 1, max: 1_000_000 }),
        }),
        ({ productCostPrice, productPrice }) => {
          const result = resolveEffectivePrices(
            { costPrice: productCostPrice, price: productPrice, unit: null },
            { costPrice: null, price: null, unit: null }
          );
          return result.effectiveCostPrice === productCostPrice;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1c: effectivePrice uses variant.price when set', () => {
    fc.assert(
      fc.property(
        fc.record({
          productCostPrice: fc.integer({ min: 1, max: 1_000_000 }),
          productPrice: fc.integer({ min: 1, max: 1_000_000 }),
          variantPrice: fc.integer({ min: 1, max: 1_000_000 }),
        }),
        ({ productCostPrice, productPrice, variantPrice }) => {
          const result = resolveEffectivePrices(
            { costPrice: productCostPrice, price: productPrice, unit: null },
            { costPrice: null, price: variantPrice, unit: null }
          );
          return result.effectivePrice === variantPrice;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1d: effectivePrice falls back to product.price when variant has none', () => {
    fc.assert(
      fc.property(
        fc.record({
          productCostPrice: fc.integer({ min: 1, max: 1_000_000 }),
          productPrice: fc.integer({ min: 1, max: 1_000_000 }),
        }),
        ({ productCostPrice, productPrice }) => {
          const result = resolveEffectivePrices(
            { costPrice: productCostPrice, price: productPrice, unit: null },
            { costPrice: null, price: null, unit: null }
          );
          return result.effectivePrice === productPrice;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1e: effectiveUnit uses variant.unit when set', () => {
    fc.assert(
      fc.property(
        fc.record({
          productUnit: fc.string({ minLength: 1, maxLength: 10 }),
          variantUnit: fc.string({ minLength: 1, maxLength: 10 }),
        }),
        ({ productUnit, variantUnit }) => {
          const result = resolveEffectivePrices(
            { costPrice: 100, price: 200, unit: productUnit },
            { costPrice: null, price: null, unit: variantUnit }
          );
          return result.effectiveUnit === variantUnit;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1f: effectiveUnit falls back to product.unit when variant has none', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        (productUnit) => {
          const result = resolveEffectivePrices(
            { costPrice: 100, price: 200, unit: productUnit },
            { costPrice: null, price: null, unit: null }
          );
          return result.effectiveUnit === productUnit;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1g: no variant → all values come from product', () => {
    fc.assert(
      fc.property(
        fc.record({
          costPrice: fc.integer({ min: 1, max: 1_000_000 }),
          price: fc.integer({ min: 1, max: 1_000_000 }),
          unit: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: null }),
        }),
        ({ costPrice, price, unit }) => {
          const result = resolveEffectivePrices({ costPrice, price, unit });
          return (
            result.effectiveCostPrice === costPrice &&
            result.effectivePrice === price &&
            result.effectiveUnit === unit
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: product-variants-and-stock-out-types, Property 2: effectivePrice >= effectiveCostPrice invariant
  test('Property 2: when effectivePrice >= effectiveCostPrice the system should accept it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500_000 }).chain((cost) =>
          fc.record({
            cost: fc.constant(cost),
            price: fc.integer({ min: cost, max: cost + 500_000 }),
          })
        ),
        ({ cost, price }) => {
          const result = resolveEffectivePrices(
            { costPrice: cost, price, unit: null }
          );
          return result.effectivePrice >= result.effectiveCostPrice;
        }
      ),
      { numRuns: 100 }
    );
  });
});
