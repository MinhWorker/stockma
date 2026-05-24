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
