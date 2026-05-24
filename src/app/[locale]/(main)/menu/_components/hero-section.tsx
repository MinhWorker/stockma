import { Suspense } from 'react';
import { getSession } from '@/lib/session';
import { getCachedDbUsage } from '@/lib/db-usage';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UsageRing({ percent }: { percent: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;
  const color = percent >= 90 ? '#f43f5e' : percent >= 70 ? '#f59e0b' : '#22c55e';

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums">{percent}%</span>
    </div>
  );
}

async function UserName({ fallback }: { fallback: string }) {
  const session = await getSession();
  const name = session?.user?.name?.split(' ').at(-1) ?? null;

  return <p className="text-base font-semibold truncate">{name ?? fallback}</p>;
}

async function DbUsageMeter() {
  const usage = await getCachedDbUsage().catch(() => null);

  if (!usage) return null;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0 ml-4">
      <UsageRing percent={usage.percent} />
      <p className="text-[10px] text-muted-foreground tabular-nums">
        {formatBytes(usage.usedBytes)} / {formatBytes(usage.totalBytes)}
      </p>
    </div>
  );
}

function DbUsageSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0 ml-4">
      <div className="h-16 w-16 rounded-full animate-shimmer" />
      <div className="h-2.5 w-20 rounded animate-shimmer" />
    </div>
  );
}

type HeroSectionProps = {
  heroGreeting: string;
  title: string;
  subtitle: string;
};

export function HeroSection({ heroGreeting, title, subtitle }: HeroSectionProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-muted/40 border border-border/60 px-4 py-3.5">
      <div className="space-y-0.5 min-w-0">
        <p className="text-xs text-muted-foreground">{heroGreeting}</p>
        <Suspense fallback={<p className="text-base font-semibold truncate">{title}</p>}>
          <UserName fallback={title} />
        </Suspense>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Suspense fallback={<DbUsageSkeleton />}>
        <DbUsageMeter />
      </Suspense>
    </div>
  );
}
