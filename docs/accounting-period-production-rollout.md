# Accounting Period Production Rollout

This rollout must separate database preparation from app deployment. The new app
requires one open accounting period for new writes, so production data must be
migrated and backfilled before promoting the app code.

## Rehearsal

1. Refresh a staging Neon branch from production.
2. Run migrations against staging:
   ```powershell
   npx prisma migrate deploy
   ```
3. Capture preflight:
   ```powershell
   npm run rollout:accounting-periods:preflight
   ```
4. Backfill staging:
   ```powershell
   npm run rollout:accounting-periods:backfill -- --confirm
   ```
5. Verify using the preflight JSON path printed by step 3:
   ```powershell
   npm run rollout:accounting-periods:verify -- --before artifacts/prod-accounting-period-rollout/preflight-....json
   ```
6. Run staging UX smoke:
   ```powershell
   $env:BASE_URL="https://stockma-git-staging-minhnks-projects.vercel.app"; npm run verify:ux
   ```

## Production

1. Confirm `DIRECT_URL`, `DATABASE_URL`, `NEON_PROJECT_ID`,
   `NEON_PRODUCTION_BRANCH_ID`, and `NEON_API_KEY` target production.
2. Ask users to pause inventory writes for the short maintenance window.
3. Capture preflight:
   ```powershell
   npm run rollout:accounting-periods:preflight
   ```
4. Create a verified backup, preferring Neon snapshot then Neon branch then
   `pg_dump` fallback:
   ```powershell
   npm run rollout:accounting-periods:backup
   ```
5. Apply migrations:
   ```powershell
   npx prisma migrate deploy
   ```
6. Backfill:
   ```powershell
   npm run rollout:accounting-periods:backfill -- --confirm
   ```
7. Verify:
   ```powershell
   npm run rollout:accounting-periods:verify -- --before artifacts/prod-accounting-period-rollout/preflight-....json
   ```
8. Deploy the app commit that contains accounting periods.
9. After Vercel reports `READY`, run:
   ```powershell
   $env:BASE_URL="https://stockma.vercel.app"; npm run verify:ux
   ```

## Acceptance

- Exactly one open accounting period.
- No legacy `accountingPeriodId = null` rows on stock transactions, return
  transactions, or debt payments.
- Stock position hash is unchanged from preflight.
- Open debt total and hash are unchanged from preflight.
- Production UX smoke passes.

Keep the Neon snapshot/branch or `pg_dump` artifact for at least 24-72 hours
after verification.
