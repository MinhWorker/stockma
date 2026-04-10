'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';

/**
 * Manages a search param that is:
 * - Read immediately from URL (for filtering server data)
 * - Written to URL with debounce (to avoid router.replace on every keystroke)
 *
 * Returns [inputValue, setInputValue, urlValue, rawUrlValue]
 * - inputValue: controlled input state (updates instantly)
 * - setInputValue: call on onChange
 * - urlValue: debounced normalized value synced to URL (use for normalized filtering)
 * - rawUrlValue: debounced raw value synced to URL (use for server fetching or custom logic)
 */
export function useDebouncedUrlParam(
  paramKey: string,
  debounceMs = 300,
  normalizeValue?: (value: string) => string
): [string, (v: string) => void, string, string] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawUrlValue = searchParams.get(paramKey) ?? '';
  const urlValue = normalizeValue ? normalizeValue(rawUrlValue) : rawUrlValue;
  const [inputValue, setInputValueState] = useState(rawUrlValue);

  // Track whether the last URL change was triggered by us (debounce write)
  // so we don't reset the input on our own router.replace calls
  const selfWriteRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync only for external URL changes (e.g. back/forward navigation)
  useEffect(() => {
    if (selfWriteRef.current) {
      selfWriteRef.current = false;
      return;
    }
    setInputValueState((currentValue) => {
      const normalizedCurrent = normalizeValue ? normalizeValue(currentValue) : currentValue;
      return normalizedCurrent === urlValue ? currentValue : rawUrlValue;
    });
  }, [rawUrlValue, urlValue, normalizeValue]);

  const setInputValue = useCallback(
    (v: string) => {
      setInputValueState(v);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const nextUrlValue = normalizeValue ? normalizeValue(v) : v;
        if (nextUrlValue === '' || nextUrlValue === 'all') params.delete(paramKey);
        else params.set(paramKey, nextUrlValue);
        const qs = params.toString();
        selfWriteRef.current = true;
        router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], {
          scroll: false,
        });
      }, debounceMs);
    },
    [router, pathname, paramKey, debounceMs, normalizeValue]
  );

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return [inputValue, setInputValue, urlValue, rawUrlValue];
}
