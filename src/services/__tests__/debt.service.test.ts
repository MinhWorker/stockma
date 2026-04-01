import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure debt logic extracted from debt.service
// ---------------------------------------------------------------------------

type DebtStatus = 'open' | 'closed' | 'cancelled';

interface DebtGroup {
  id: number;
  totalAmount: number;
  paidAmount: number;
  status: DebtStatus;
}

function createDebtGroup(totalAmount: number, paidAmount: number): DebtGroup {
  // paidAmount must be < totalAmount to create a debt (per requirement 11.5)
  return {
    id: 1,
    totalAmount,
    paidAmount,
    status: 'open',
  };
}

function applyPayment(dg: DebtGroup, amount: number): DebtGroup {
  if (dg.status !== 'open') throw new Error('ERR_DEBT_ALREADY_CLOSED');
  const newPaidAmount = dg.paidAmount + amount;
  const newStatus: DebtStatus = newPaidAmount >= dg.totalAmount ? 'closed' : 'open';
  return { ...dg, paidAmount: newPaidAmount, status: newStatus };
}

function closeDebt(dg: DebtGroup): DebtGroup {
  if (dg.status !== 'open') throw new Error('ERR_DEBT_ALREADY_CLOSED');
  const newStatus: DebtStatus = dg.paidAmount >= dg.totalAmount ? 'closed' : 'cancelled';
  return { ...dg, status: newStatus };
}

// Feature: product-variants-and-stock-out-types, Property 11: New DebtGroup has status = open
describe('DebtGroup creation', () => {
  test('Property 11: newly created DebtGroup always has status = open', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.integer({ min: 1, max: 10_000_000 }),
          paidAmount: fc.integer({ min: 0, max: 9_999_999 }),
        }).filter(({ totalAmount, paidAmount }) => paidAmount < totalAmount),
        ({ totalAmount, paidAmount }) => {
          const dg = createDebtGroup(totalAmount, paidAmount);
          return dg.status === 'open';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11b: paidAmount is stored correctly on creation', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.integer({ min: 2, max: 10_000_000 }),
          paidAmount: fc.integer({ min: 0, max: 9_999_999 }),
        }).filter(({ totalAmount, paidAmount }) => paidAmount < totalAmount),
        ({ totalAmount, paidAmount }) => {
          const dg = createDebtGroup(totalAmount, paidAmount);
          return dg.paidAmount === paidAmount && dg.totalAmount === totalAmount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: product-variants-and-stock-out-types, Property 12: Auto-close debt when paidAmount >= totalAmount
describe('DebtGroup auto-close', () => {
  test('Property 12a: adding payment that reaches totalAmount auto-closes the debt', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.integer({ min: 2, max: 10_000_000 }),
          initialPaid: fc.integer({ min: 0, max: 9_999_999 }),
        }).filter(({ totalAmount, initialPaid }) => initialPaid < totalAmount),
        ({ totalAmount, initialPaid }) => {
          const dg = createDebtGroup(totalAmount, initialPaid);
          const remaining = totalAmount - initialPaid;
          const updated = applyPayment(dg, remaining);
          return updated.status === 'closed' && updated.paidAmount >= totalAmount;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12b: overpayment also closes the debt', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.integer({ min: 1, max: 1_000_000 }),
          initialPaid: fc.integer({ min: 0, max: 999_999 }),
          extra: fc.integer({ min: 1, max: 1_000_000 }),
        }).filter(({ totalAmount, initialPaid }) => initialPaid < totalAmount),
        ({ totalAmount, initialPaid, extra }) => {
          const dg = createDebtGroup(totalAmount, initialPaid);
          const remaining = totalAmount - initialPaid;
          const updated = applyPayment(dg, remaining + extra);
          return updated.status === 'closed';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12c: partial payment keeps status = open', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.integer({ min: 3, max: 10_000_000 }),
          initialPaid: fc.integer({ min: 0, max: 9_999_998 }),
        }).filter(({ totalAmount, initialPaid }) => initialPaid < totalAmount - 1),
        ({ totalAmount, initialPaid }) => {
          const dg = createDebtGroup(totalAmount, initialPaid);
          const partialPayment = Math.max(1, Math.floor((totalAmount - initialPaid) / 2));
          if (initialPaid + partialPayment >= totalAmount) return true; // skip edge case
          const updated = applyPayment(dg, partialPayment);
          return updated.status === 'open';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12d: adding payment to closed/cancelled debt throws ERR_DEBT_ALREADY_CLOSED', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('closed' as const, 'cancelled' as const),
        (status) => {
          const dg: DebtGroup = { id: 1, totalAmount: 1000, paidAmount: 500, status };
          try {
            applyPayment(dg, 100);
            return false; // should have thrown
          } catch (e) {
            return e instanceof Error && e.message === 'ERR_DEBT_ALREADY_CLOSED';
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12e: manual close with paidAmount < totalAmount → cancelled', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.integer({ min: 2, max: 10_000_000 }),
          paidAmount: fc.integer({ min: 0, max: 9_999_999 }),
        }).filter(({ totalAmount, paidAmount }) => paidAmount < totalAmount),
        ({ totalAmount, paidAmount }) => {
          const dg = createDebtGroup(totalAmount, paidAmount);
          const closed = closeDebt(dg);
          return closed.status === 'cancelled';
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12f: manual close with paidAmount >= totalAmount → closed', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalAmount: fc.integer({ min: 1, max: 10_000_000 }),
          extra: fc.integer({ min: 0, max: 1_000_000 }),
        }),
        ({ totalAmount, extra }) => {
          const dg: DebtGroup = { id: 1, totalAmount, paidAmount: totalAmount + extra, status: 'open' };
          const closed = closeDebt(dg);
          return closed.status === 'closed';
        }
      ),
      { numRuns: 100 }
    );
  });
});
