'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';

export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key);

  const set = (key: string, value: string, options?: { scroll?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}` as Parameters<typeof router.replace>[0], {
      scroll: options?.scroll ?? false,
    });
  };

  const remove = (key: string | string[], options?: { scroll?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach((k) => params.delete(k));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], {
      scroll: options?.scroll ?? false,
    });
  };

  const replace = (updates: Record<string, string | null>, options?: { scroll?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], {
      scroll: options?.scroll ?? false,
    });
  };

  return { get, set, remove, replace, searchParams };
}
