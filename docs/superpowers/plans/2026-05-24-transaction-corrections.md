# Transaction Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add immutable transaction correction/cancellation records that target a previous transaction while preserving the original record.

**Architecture:** Keep `StockTransaction` as an append-only ledger. A correction is stored as an `adjustment` transaction with a `correctionType`, `targetTransactionId`, and optional `correctedQuantity`; the stock effect is the delta between the original signed quantity and the new intended signed quantity. The UI starts from transaction history/detail, explains the original record stays unchanged, and creates the correction through a server action.

**Tech Stack:** Next.js App Router, Prisma/Postgres, TypeScript, Vitest.

---

### Task 1: Model Correction Semantics

**Files:**
- Modify: `src/services/types.ts`
- Modify: `src/types/transaction.ts`
- Modify: `src/services/transaction.service.ts`
- Test: `src/services/__tests__/transaction.service.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that call exported helpers:

```ts
expect(calculateCorrectionDelta({ targetType: 'stock_in', targetQuantity: 100, correctedQuantity: 10 })).toBe(-90);
expect(calculateCorrectionDelta({ targetType: 'stock_out', targetQuantity: -100, correctedQuantity: 10 })).toBe(90);
expect(calculateCancellationDelta({ targetQuantity: 100 })).toBe(-100);
expect(calculateCancellationDelta({ targetQuantity: -5 })).toBe(5);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/services/__tests__/transaction.service.test.ts`

Expected: fail because `calculateCorrectionDelta` and `calculateCancellationDelta` are not exported.

- [ ] **Step 3: Implement helpers and types**

Add `TransactionCorrectionType = 'quantity_edit' | 'cancellation'`, correction metadata fields to `TransactionRecord`, and helper functions in `transaction.service.ts`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/services/__tests__/transaction.service.test.ts`

Expected: pass.

### Task 2: Persist Correction Metadata

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_transaction_corrections/migration.sql`
- Modify: `src/services/transaction.service.ts`

- [ ] **Step 1: Add Prisma fields**

Add nullable fields to `StockTransaction`: `targetTransactionId`, self-relation `correctionTransactions`, `correctionType`, and `correctedQuantity`.

- [ ] **Step 2: Add SQL migration**

Create enum `TransactionCorrectionType`, add nullable columns, foreign key, and index.

- [ ] **Step 3: Map fields in service records**

Include the new fields in transaction query mapping.

- [ ] **Step 4: Generate Prisma client**

Run: `npx prisma generate`.

### Task 3: Create Correction Service And Action

**Files:**
- Modify: `src/services/transaction.service.ts`
- Modify: `src/actions/inventory.action.ts`

- [ ] **Step 1: Add service input**

Add `CreateTransactionCorrectionInput` with `targetTransactionId`, `correctionType`, optional `correctedQuantity`, note, and user.

- [ ] **Step 2: Implement `createTransactionCorrection`**

Load the target transaction, compute delta, validate same product/variant, prevent no-op correction, prevent negative stock, and create a new `adjustment` transaction pointing to the target.

- [ ] **Step 3: Add server action**

Expose `createTransactionCorrectionAction`, revalidate transaction/product cache tags, and return structured success/error.

- [ ] **Step 4: Add tests if helper behavior expands**

Run targeted tests after implementation.

### Task 4: Add History UI Entry Point

**Files:**
- Modify: `src/app/[locale]/(main)/menu/inventory/_components/transaction-detail-drawer.tsx`
- Modify: `messages/vi.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add correction dialog**

In transaction detail, add buttons for quantity correction and cancellation. The dialog explains that the original transaction stays in history.

- [ ] **Step 2: Validate user input**

Require a positive corrected quantity for `stock_in`/`stock_out`, allow signed correction for adjustment only if needed, and require confirmation for cancellation.

- [ ] **Step 3: Submit through server action**

Call `createTransactionCorrectionAction` and close/reset on success.

- [ ] **Step 4: Display correction metadata**

Show whether a transaction targets another transaction or is itself the target of correction.

### Task 5: Verify

**Files:**
- No code files.

- [ ] **Step 1: Run tests**

Run: `npm test`.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`.

- [ ] **Step 3: Run lint**

Run: `npm run lint`.

- [ ] **Step 4: Run build**

Run: `npm run build`.
