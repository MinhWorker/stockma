import 'dotenv/config';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const OUT_DIR = join(process.cwd(), 'artifacts', 'prod-accounting-period-rollout');
const NEON_API_BASE = 'https://console.neon.tech/api/v2';

type BackupStrategy = 'auto' | 'snapshot' | 'branch' | 'pgdump';

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function getArg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function getStrategy(): BackupStrategy {
  const strategy = getArg('--strategy') ?? 'auto';
  if (!['auto', 'snapshot', 'branch', 'pgdump'].includes(strategy)) {
    throw new Error(`Invalid --strategy ${strategy}`);
  }
  return strategy as BackupStrategy;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function writeJson(prefix: string, data: unknown) {
  await mkdir(OUT_DIR, { recursive: true });
  const filePath = join(OUT_DIR, `${prefix}-${timestamp()}.json`);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(filePath);
  return filePath;
}

async function neonFetch(path: string, init: RequestInit = {}) {
  const apiKey = requireEnv('NEON_API_KEY');
  const response = await fetch(`${NEON_API_BASE}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`Neon API ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

function getOperationIds(response: { operations?: Array<{ id?: string }> }) {
  return (response.operations ?? []).map((operation) => operation.id).filter((id): id is string => Boolean(id));
}

async function pollNeonOperations(projectId: string, operationIds: string[]) {
  for (const operationId of operationIds) {
    for (;;) {
      const response = await neonFetch(`/projects/${projectId}/operations/${operationId}`);
      const status = response.operation?.status ?? response.status;
      if (['finished', 'skipped', 'cancelled'].includes(status)) break;
      if (status === 'failed') throw new Error(`Neon operation failed: ${operationId}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function createSnapshotBackup(name: string) {
  const projectId = requireEnv('NEON_PROJECT_ID');
  const branchId = requireEnv('NEON_PRODUCTION_BRANCH_ID');
  const expiresAt = new Date(Date.now() + Number(getArg('--ttl-hours') ?? 72) * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({ name, expires_at: expiresAt });
  const response = await neonFetch(
    `/projects/${projectId}/branches/${branchId}/snapshot?${params.toString()}`,
    { method: 'POST' }
  );
  await pollNeonOperations(projectId, getOperationIds(response));
  return { strategy: 'snapshot', projectId, branchId, name, expiresAt, response };
}

async function createBranchBackup(name: string) {
  const projectId = requireEnv('NEON_PROJECT_ID');
  const branchId = requireEnv('NEON_PRODUCTION_BRANCH_ID');
  const response = await neonFetch(`/projects/${projectId}/branches`, {
    method: 'POST',
    body: JSON.stringify({
      branch: {
        name,
        parent_id: branchId,
      },
    }),
  });
  await pollNeonOperations(projectId, getOperationIds(response));
  return { strategy: 'branch', projectId, branchId, name, response };
}

async function sha256File(filePath: string) {
  const hash = createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', resolve);
  });
  return hash.digest('hex');
}

async function createPgDumpBackup(name: string) {
  const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Missing DIRECT_URL or DATABASE_URL for pg_dump fallback');

  await mkdir(OUT_DIR, { recursive: true });
  const dumpPath = join(OUT_DIR, `${name}.dump`);
  const listPath = join(OUT_DIR, `${name}.pg_restore_list.txt`);

  const dump = spawnSync('pg_dump', [
    '--format=custom',
    '--no-owner',
    '--no-acl',
    '--dbname',
    databaseUrl,
    '--file',
    dumpPath,
  ], { stdio: 'inherit' });
  if (dump.status !== 0) throw new Error('pg_dump failed');

  const restoreList = spawnSync('pg_restore', ['-l', dumpPath], { encoding: 'utf8' });
  if (restoreList.status !== 0) throw new Error(`pg_restore -l failed: ${restoreList.stderr}`);
  await writeFile(listPath, restoreList.stdout, 'utf8');

  return {
    strategy: 'pgdump',
    dumpPath,
    listPath,
    sha256: await sha256File(dumpPath),
  };
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log([
      'Usage:',
      '  npm run rollout:accounting-periods:backup',
      '  npm run rollout:accounting-periods:backup -- --strategy snapshot',
      '  npm run rollout:accounting-periods:backup -- --strategy branch',
      '  npm run rollout:accounting-periods:backup -- --strategy pgdump',
      '',
      'Required for Neon strategies: NEON_API_KEY, NEON_PROJECT_ID, NEON_PRODUCTION_BRANCH_ID',
      'Required for pgdump fallback: DIRECT_URL or DATABASE_URL plus pg_dump/pg_restore on PATH',
    ].join('\n'));
    return;
  }

  const strategy = getStrategy();
  const name = getArg('--name') ?? `prod-pre-accounting-periods-${timestamp()}`;
  const attempts: Array<{ strategy: string; error: string }> = [];

  for (const candidate of strategy === 'auto' ? ['snapshot', 'branch', 'pgdump'] : [strategy]) {
    try {
      const result =
        candidate === 'snapshot' ? await createSnapshotBackup(name)
        : candidate === 'branch' ? await createBranchBackup(name)
        : await createPgDumpBackup(name);
      await writeJson('backup', result);
      return;
    } catch (error) {
      attempts.push({ strategy: candidate, error: error instanceof Error ? error.message : String(error) });
      if (strategy !== 'auto') throw error;
    }
  }

  await writeJson('backup-failed', { name, attempts });
  throw new Error('All backup strategies failed');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
