import 'server-only';

import { unstable_cache } from 'next/cache';

export const DB_USAGE_REVALIDATE_SECONDS = 6 * 60 * 60;
export const DB_USAGE_CACHE_TAG = 'db-usage';

const FREE_TIER_BYTES = 512 * 1024 * 1024; // 0.5 GB

export type DbUsage = {
  percent: number;
  usedBytes: number;
  totalBytes: number;
};

export class DbUsageError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DbUsageError';
  }
}

async function fetchDbUsage(): Promise<DbUsage> {
  const projectId = process.env.NEON_PROJECT_ID;
  const apiKey = process.env.NEXTJS_USAGE_MONITOR_KEY;

  if (!projectId || !apiKey) {
    throw new DbUsageError('Missing config', 500);
  }

  const res = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'force-cache',
    next: {
      revalidate: DB_USAGE_REVALIDATE_SECONDS,
      tags: [DB_USAGE_CACHE_TAG],
    },
  });

  if (!res.ok) {
    throw new DbUsageError('Neon API error', res.status);
  }

  const data = await res.json();
  const usedBytes: number = data.project?.synthetic_storage_size ?? 0;
  const percent = Math.min(100, Math.round((usedBytes / FREE_TIER_BYTES) * 100));

  return { usedBytes, totalBytes: FREE_TIER_BYTES, percent };
}

export const getCachedDbUsage = unstable_cache(fetchDbUsage, ['neon-db-usage-v1'], {
  revalidate: DB_USAGE_REVALIDATE_SECONDS,
  tags: [DB_USAGE_CACHE_TAG],
});
