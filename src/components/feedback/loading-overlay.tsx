'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface LoadingOverlayContextValue {
  show: () => void;
  hide: () => void;
}

const LoadingOverlayContext = React.createContext<LoadingOverlayContextValue | null>(null);

export function useLoadingOverlay() {
  const ctx = React.useContext(LoadingOverlayContext);
  if (!ctx) throw new Error('useLoadingOverlay must be used within LoadingOverlayProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider + Overlay
// ---------------------------------------------------------------------------

export function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = React.useState(0);
  const visible = count > 0;

  const show = React.useCallback(() => setCount((n) => n + 1), []);
  const hide = React.useCallback(() => setCount((n) => Math.max(0, n - 1)), []);

  return (
    <LoadingOverlayContext.Provider value={{ show, hide }}>
      {children}
      {visible && typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[200] flex items-center justify-center"
          >
            <div className="flex items-center justify-center rounded-2xl bg-black/70 p-5">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          </div>,
          document.body
        )
      }
    </LoadingOverlayContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Helper hook — wraps an async fn, shows overlay while it runs
// with a minimum display duration so fast actions are still visible
// ---------------------------------------------------------------------------

export function useWithLoading() {
  const { show, hide } = useLoadingOverlay();
  return React.useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      show();
      try {
        return await fn();
      } finally {
        hide();
      }
    },
    [show, hide]
  );
}
