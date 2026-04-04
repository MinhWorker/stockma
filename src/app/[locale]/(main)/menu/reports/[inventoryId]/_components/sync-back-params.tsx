'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryParams } from '@/hooks/use-query-params';

/**
 * Keeps the `back` search param in sync with the current date filter params.
 * When the user changes date filters, the `back` URL is updated so navigating
 * back to the reports hub preserves the selected dates.
 */
export function SyncBackParams() {
  const { set } = useQueryParams();
  const searchParams = useSearchParams();

  const back = searchParams.get('back');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  useEffect(() => {
    if (!back) return;

    const backUrl = new URL(back, window.location.origin);
    if (from) backUrl.searchParams.set('from', from);
    else backUrl.searchParams.delete('from');
    if (to) backUrl.searchParams.set('to', to);
    else backUrl.searchParams.delete('to');

    const newBack = backUrl.pathname + (backUrl.search || '');
    if (newBack === back) return;

    set('back', newBack);
  }, [from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
