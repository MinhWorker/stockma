import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure validation logic extracted from return.service
// ---------------------------------------------------------------------------

function validateReturnQty(returnQty: number, replacementQty: number): string | null {
  if (returnQty < 0 || replacementQty < 0) return 'ERR_RETURN_QTY_INVALID';
  if (returnQty + replacementQty === 0) return 'ERR_RETURN_QTY_INVALID';
  return null;
}

// Feature: product-variants-and-stock-out-types, Property 9: ReturnTransaction qty validation
describe('ReturnTransaction qty validation', () => {
  test('Property 9a: negative returnQty is rejected', () => {
    fc.assert(
      fc.property(
        fc.record({
          returnQty: fc.integer({ min: -10_000, max: -1 }),
          replacementQty: fc.integer({ min: 0, max: 10_000 }),
        }),
        ({ returnQty, replacementQty }) => {
          return validateReturnQty(returnQty, replacementQty) === 'ERR_RETURN_QTY_INVALID';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9b: negative replacementQty is rejected', () => {
    fc.assert(
      fc.property(
        fc.record({
          returnQty: fc.integer({ min: 0, max: 10_000 }),
          replacementQty: fc.integer({ min: -10_000, max: -1 }),
        }),
        ({ returnQty, replacementQty }) => {
          return validateReturnQty(returnQty, replacementQty) === 'ERR_RETURN_QTY_INVALID';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9c: both zero is rejected', () => {
    expect(validateReturnQty(0, 0)).toBe('ERR_RETURN_QTY_INVALID');
  });

  test('Property 9d: valid combinations (at least one > 0) are accepted', () => {
    fc.assert(
      fc.property(
        fc.record({
          returnQty: fc.integer({ min: 0, max: 10_000 }),
          replacementQty: fc.integer({ min: 0, max: 10_000 }),
        }).filter(({ returnQty, replacementQty }) => returnQty + replacementQty > 0),
        ({ returnQty, replacementQty }) => {
          return validateReturnQty(returnQty, replacementQty) === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9e: returnQty=0 with replacementQty>0 is valid (replacement only)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000 }),
        (replacementQty) => {
          return validateReturnQty(0, replacementQty) === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9f: returnQty>0 with replacementQty=0 is valid (return only)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000 }),
        (returnQty) => {
          return validateReturnQty(returnQty, 0) === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});
