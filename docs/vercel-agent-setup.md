# Vercel Agent Deployment Notes

The repo has been linked to Vercel locally. Agents can use the local Vercel
metadata to track deployments instead of waiting a fixed number of minutes after
every push.

## Local Metadata

Current Vercel CLI versions create:

```txt
.vercel/repo.json
```

It contains project entries like:

```json
{
  "projects": [
    {
      "id": "prj_...",
      "name": "stockma",
      "directory": ".",
      "orgId": "team_..."
    }
  ]
}
```

Older Vercel CLI versions may create `.vercel/project.json` with `projectId`
and `orgId` instead. Support both formats when possible.

The `.vercel/` folder is intentionally ignored by git. Do not commit it.

## Future Agent Flow

After pushing to `master`, an agent should:

1. Read `project id` and `org/team id` from `.vercel/repo.json` or
   `.vercel/project.json`.
2. Poll Vercel deployments for this project.
3. Confirm the newest deployment for `master` is `READY`.
4. Run the production UX smoke test:

```bash
$env:BASE_URL="https://stockma.vercel.app"; npm run verify:ux
```

## Stable Staging Flow

StockMa has a fixed staging lane:

```txt
Git branch: staging
Vercel URL: https://stockma-git-staging-minhnks-projects.vercel.app/
Neon branch: staging
```

The staging Vercel Preview environment must be scoped to Git branch `staging`
and must not use the production Neon branch. Required staging values:

```txt
DATABASE_URL=<pooled Neon connection string for Neon branch staging>
DIRECT_URL=<direct Neon connection string for Neon branch staging>
BETTER_AUTH_URL=https://stockma-git-staging-minhnks-projects.vercel.app
NEXT_PUBLIC_APP_URL=https://stockma-git-staging-minhnks-projects.vercel.app
NEON_PROJECT_ID=<Neon project id>
NEXTJS_USAGE_MONITOR_KEY=<Neon API key used by /api/db-usage>
```

The staging URL must remain accessible without Vercel SSO deployment protection;
otherwise automated UX smoke tests will stop at Vercel's authentication page
instead of reaching StockMa's login screen. If needed, check:

```bash
npx vercel@latest project protection stockma --format json
```

and disable SSO protection for this project:

```bash
npx vercel@latest project protection disable stockma --sso
```

The repo-level Vercel build command lives in `vercel.json`:

```bash
npx prisma migrate deploy && npm run build
```

That command applies migrations to the staging branch database during staging
deployments, because `prisma.config.ts` reads `DIRECT_URL` first.

To refresh staging with the current checked-out commit:

```bash
git push origin HEAD:staging
```

Then wait for the newest Vercel deployment for branch `staging` to become
`READY` and run:

```bash
$env:BASE_URL="https://stockma-git-staging-minhnks-projects.vercel.app"; npm run verify:ux
```
