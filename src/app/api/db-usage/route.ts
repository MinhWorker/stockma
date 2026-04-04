import { NextResponse } from 'next/server';

const FREE_TIER_BYTES = 512 * 1024 * 1024; // 0.5 GB

export async function GET() {
  const projectId = process.env.NEON_PROJECT_ID;
  const apiKey = process.env.NEXTJS_USAGE_MONITOR_KEY;

  if (!projectId || !apiKey) {
    return NextResponse.json({ error: 'Missing config' }, { status: 500 });
  }

  const res = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Neon API error' }, { status: res.status });
  }

  const data = await res.json();
  const usedBytes: number = data.project?.synthetic_storage_size ?? 0;
  const percent = Math.min(100, Math.round((usedBytes / FREE_TIER_BYTES) * 100));

  return NextResponse.json({ usedBytes, totalBytes: FREE_TIER_BYTES, percent });
}
