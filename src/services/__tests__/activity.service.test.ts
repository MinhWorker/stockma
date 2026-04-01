import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure logic for activity log validation
// ---------------------------------------------------------------------------

type ActivityAction = 'create' | 'update' | 'delete' | 'export';

const CONFIG_ENTITY_TYPES = ['Product', 'ProductVariant', 'ProductCategory', 'Provider', 'Inventory'] as const;
type ConfigEntityType = typeof CONFIG_ENTITY_TYPES[number];

const TRANSACTION_ENTITY_TYPES = ['StockTransaction', 'ReturnTransaction', 'DebtGroup', 'DebtPayment'] as const;
type TransactionEntityType = typeof TRANSACTION_ENTITY_TYPES[number];

interface ActivityLogEntry {
  action: ActivityAction;
  entityType: string;
  entityId?: number;
  entityName?: string;
  description: string;
  userId: string;
}

function shouldLogActivity(entityType: string): boolean {
  return (CONFIG_ENTITY_TYPES as readonly string[]).includes(entityType);
}

function createActivityLog(input: {
  action: ActivityAction;
  entityType: string;
  entityId?: number;
  entityName?: string;
  description: string;
  userId: string;
}): ActivityLogEntry {
  return { ...input };
}

// Feature: product-variants-and-stock-out-types, Property 13: ActivityLog created for config mutations
describe('ActivityLog for config mutations', () => {
  test('Property 13a: config entity types should trigger activity logging', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CONFIG_ENTITY_TYPES),
        (entityType) => {
          return shouldLogActivity(entityType) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 13b: ActivityLog entry contains correct action and entityType', () => {
    fc.assert(
      fc.property(
        fc.record({
          action: fc.constantFrom('create' as const, 'update' as const, 'delete' as const, 'export' as const),
          entityType: fc.constantFrom(...CONFIG_ENTITY_TYPES),
          entityId: fc.integer({ min: 1, max: 100_000 }),
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        ({ action, entityType, entityId, userId, description }) => {
          const log = createActivityLog({ action, entityType, entityId, description, userId });
          return log.action === action && log.entityType === entityType && log.userId === userId;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 13c: all required fields are preserved in ActivityLog', () => {
    fc.assert(
      fc.property(
        fc.record({
          action: fc.constantFrom('create' as const, 'update' as const, 'delete' as const),
          entityType: fc.constantFrom(...CONFIG_ENTITY_TYPES),
          entityId: fc.integer({ min: 1, max: 100_000 }),
          entityName: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 200 }),
          userId: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (input) => {
          const log = createActivityLog(input);
          return (
            log.action === input.action &&
            log.entityType === input.entityType &&
            log.entityId === input.entityId &&
            log.entityName === input.entityName &&
            log.description === input.description &&
            log.userId === input.userId
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: product-variants-and-stock-out-types, Property 14: No ActivityLog for transactions
describe('ActivityLog NOT created for transaction entities', () => {
  test('Property 14: transaction entity types should NOT trigger activity logging', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TRANSACTION_ENTITY_TYPES),
        (entityType) => {
          return shouldLogActivity(entityType) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 14b: unknown entity types also do not trigger activity logging', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !(CONFIG_ENTITY_TYPES as readonly string[]).includes(s)
        ),
        (entityType) => {
          return shouldLogActivity(entityType) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
