# StockMa Agent Guide

This file is the project operating guide for Codex and other coding agents.
Keep changes grounded in the actual app, verify affected flows, and prefer small
product improvements that help non-technical users complete inventory work with
less doubt.

## Product Context

StockMa is a Vietnamese-first inventory web app. The primary users are not
deeply technical, so UI copy and flow design should be explicit, forgiving, and
task-oriented.

Important user flows:

- Login
- Stock in: `/vi/menu/stock-in`
- Stock out: `/vi/menu/stock-out`
- Return/exchange tab inside stock out
- Product and variant selection
- Debt tracking and gift items in retail stock-out

## Local Setup

Use localhost for local browser checks:

```bash
npm run dev
```

Default local URL:

```txt
http://localhost:3000/vi/login
```

Seed users are defined in `prisma/seed.ts`:

```txt
phamdungcm1981@gmail.com / prim@stkm01
minhnk.work@gmail.com / prim@stkm01
```

For realistic UI testing, seed demo inventory data after users exist:

```bash
npx tsx prisma/seed-dev.ts
```

## Required Checks

Run these before committing product changes:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For UI/UX changes, also run the browser smoke test while the app is running:

```bash
npm run verify:ux
```

To check production after deploy:

```bash
$env:BASE_URL="https://stockma.vercel.app"; npm run verify:ux
```

Screenshots and JSON results are written to `artifacts/ux-checks/`, which is
ignored by git.

## UI/UX Rules

- Button text must describe the actual action. Avoid generic labels such as
  "Lưu" on task-specific screens.
- Prefer plain Vietnamese that tells the user what will happen: "Ghi nhận nhập
  kho", "Ghi nhận xuất kho", "Thêm hàng tặng", "Ghi nợ cho khách".
- Optional or advanced sections should start collapsed unless the user clearly
  needs them.
- Required fields need clear labels, useful helper text, and validation messages
  that explain the next step.
- Product variants must be explained when selection affects stock or price.
- Success screens should confirm the completed task and offer the next likely
  action.
- Mobile viewport is the primary review target. Desktop should still remain
  usable and readable.

## Definition Of Done For UI Work

A UI/UX change is done when:

- Affected flows were checked in a mobile viewport.
- Labels, helper text, validation, and success states are understandable without
  technical knowledge.
- No generic CTA remains in the affected screen.
- Optional sections do not distract users before they are needed.
- `lint`, `typecheck`, tests, and build pass.
- Production smoke test passes after the change is deployed.

## Vercel Notes

Production URL:

```txt
https://stockma.vercel.app/
```

Stable staging URL:

```txt
https://stockma-git-staging-minhnks-projects.vercel.app/
```

Staging is the fixed Vercel Preview deployment for the Git branch `staging`.
It must use the Neon branch named `staging`, not the production Neon branch.
The staging URL must remain accessible without Vercel SSO protection so agents
can run `verify:ux` against it.
For staging, configure Vercel Preview environment variables scoped to Git branch
`staging`:

```txt
DATABASE_URL=<pooled Neon connection string for branch staging>
DIRECT_URL=<direct Neon connection string for branch staging>
BETTER_AUTH_URL=https://stockma-git-staging-minhnks-projects.vercel.app
NEXT_PUBLIC_APP_URL=https://stockma-git-staging-minhnks-projects.vercel.app
NEON_PROJECT_ID=<same Neon project id>
NEXTJS_USAGE_MONITOR_KEY=<Neon API key used by db usage monitor>
```

The Vercel build command is defined in `vercel.json` and runs Prisma migrations
before building:

```bash
npx prisma migrate deploy && npm run build
```

The project is linked locally with Vercel. Read deployment metadata from
`.vercel/repo.json`; older Vercel CLI versions may use `.vercel/project.json`.
The `.vercel/` folder is intentionally ignored by git.

Use the metadata to poll Vercel deployments after pushing to `master`. The
production check is complete only after the latest deployment is `READY` and the
production UX smoke test passes.

To check staging after deploying branch `staging`:

```bash
$env:BASE_URL="https://stockma-git-staging-minhnks-projects.vercel.app"; npm run verify:ux
```
