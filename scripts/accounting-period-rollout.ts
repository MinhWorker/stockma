import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import rollout from '../src/services/accounting-period-rollout.service';
import { prisma } from '../src/lib/db';

const {
  backfillInitialAccountingPeriod,
  collectAccountingPeriodRolloutSnapshot,
  compareAccountingPeriodRolloutSnapshots,
} = rollout;

const OUT_DIR = join(process.cwd(), 'artifacts', 'prod-accounting-period-rollout');

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function writeJson(prefix: string, data: unknown) {
  await mkdir(OUT_DIR, { recursive: true });
  const filePath = join(OUT_DIR, `${prefix}-${timestamp()}.json`);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(filePath);
  return filePath;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function getArg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log([
      'Usage:',
      '  npx tsx scripts/accounting-period-rollout.ts preflight',
      '  npx tsx scripts/accounting-period-rollout.ts backfill --confirm',
      '  npx tsx scripts/accounting-period-rollout.ts verify --before <preflight-json>',
    ].join('\n'));
    return;
  }

  const command = process.argv[2];

  if (command === 'preflight') {
    const snapshot = await collectAccountingPeriodRolloutSnapshot();
    await writeJson('preflight', snapshot);
    return;
  }

  if (command === 'backfill') {
    if (!hasFlag('--confirm')) {
      throw new Error('Refusing to write without --confirm');
    }
    const result = await backfillInitialAccountingPeriod();
    await writeJson('backfill', result);
    return;
  }

  if (command === 'verify') {
    const beforePath = getArg('--before');
    if (!beforePath) throw new Error('Missing --before <preflight-json>');

    const before = JSON.parse(await readFile(beforePath, 'utf8'));
    const after = await collectAccountingPeriodRolloutSnapshot();
    const comparison = compareAccountingPeriodRolloutSnapshots(before, after);
    await writeJson('verify', { beforePath, after, comparison });

    if (!comparison.ok) {
      throw new Error(`Rollout verification failed: ${comparison.errors.join(', ')}`);
    }
    return;
  }

  throw new Error(
    [
      'Usage:',
      '  npx tsx scripts/accounting-period-rollout.ts preflight',
      '  npx tsx scripts/accounting-period-rollout.ts backfill --confirm',
      '  npx tsx scripts/accounting-period-rollout.ts verify --before <preflight-json>',
    ].join('\n')
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
