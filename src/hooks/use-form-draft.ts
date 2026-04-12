'use client';

import { useEffect, useRef } from 'react';

/**
 * Persists form state to sessionStorage so it survives a navigation away and back.
 * Call `save()` before navigating away, and the hook restores on mount then clears.
 */
export function useFormDraft<T>(key: string, onRestore: (draft: T) => void) {
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // Restore on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const draft = JSON.parse(raw) as T;
        onRestoreRef.current(draft);
        sessionStorage.removeItem(key);
      }
    } catch {
      sessionStorage.removeItem(key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function save(state: T) {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // sessionStorage unavailable — silently ignore
    }
  }

  return { save };
}
