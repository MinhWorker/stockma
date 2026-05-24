import { NextResponse } from 'next/server';
import { DbUsageError, getCachedDbUsage } from '@/lib/db-usage';

export const revalidate = 21600;

export async function GET() {
  try {
    return NextResponse.json(await getCachedDbUsage());
  } catch (error) {
    if (error instanceof DbUsageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Unable to load database usage' }, { status: 500 });
  }
}
