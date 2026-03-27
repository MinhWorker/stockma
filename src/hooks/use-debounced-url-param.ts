'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';

/**
 * Manages a search param that is:
 * - Read immediately from URL (for filtering server data)
 * - Written to URL with debounce (to avoid router.replace on every keystroke)
 *
 * Returns [inputValue, setInputValue, urlValue]
 * - inputValue: controlled input state (updates instantly)
 * - setInputValue: call on onChange
 * - urlValue: debounced value synced to URL (use for filtering)
 */
export function useDebouncedUrlParam(
  paramKey: string,
  debounceMs = 300
): [string, (v: string) => void, string] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlValue = searchParams.get(paramKey) ?? '';
  const [inputValue, setInputValueState] = useState(urlValue);

  // Keep input in sync if URL changes externally (e.g. back/forward)
  useEffect(() => {
    setInputValueState(urlValue);
  }, [urlValue]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setInputValue = useCallback(
    (v: string) => {
      setInputValueState(v);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        if (v === '' || v === 'all') params.delete(paramKey);
        else params.set(paramKey, v);
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], {
          scroll: false,
        });
      }, debounceMs);
    },
    [router, pathname, paramKey, debounceMs]
  );

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return [inputValue, setInputValue, urlValue];
}
