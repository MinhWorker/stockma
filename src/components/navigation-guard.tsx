'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from './feedback/confirm-dialog';

interface NavigationGuardContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  requestLeave: (onConfirm: () => void) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
  return ctx;
}

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const [isDirty, setDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Function to request leaving a dirty page
  const requestLeave = useCallback((onConfirm: () => void) => {
    if (isDirty) {
      pendingActionRef.current = onConfirm;
      setShowConfirm(true);
    } else {
      onConfirm();
    }
  }, [isDirty]);

  // Handle browser back/forward (PopStateEvent)
  useEffect(() => {
    if (!isDirty) return;

    // Push a dummy state to history to intercept the next back press
    window.history.pushState({ navigationGuard: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      // Re-push the guard state so the user stays on the current page for now
      window.history.pushState({ navigationGuard: true }, '');
      
      pendingActionRef.current = () => {
        // User confirmed: we let the navigation happen 
        // We need to go back twice: once for the dummy we just pushed,
        // and once for the original back navigation that triggered this.
        setDirty(false); 
        window.history.go(-2);
      };
      setShowConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up the dummy state if we're still on it
      if (window.history.state?.navigationGuard) {
        window.history.back();
      }
    };
  }, [isDirty]);

  const handleConfirm = () => {
    setShowConfirm(false);
    
    // Add a small delay to let the modal close animation finish 
    // before the page transition starts to avoid visual flickering.
    setTimeout(() => {
      if (pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        action();
      }
    }, 150);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    pendingActionRef.current = null;
  };

  return (
    <NavigationGuardContext.Provider value={{ isDirty, setDirty, requestLeave }}>
      {children}
      
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={t('unsavedChangesTitle')}
        description={t('unsavedChangesDesc')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmLabel={t('unsavedChangesDiscard')}
        cancelLabel={t('unsavedChangesStay')}
        variant="destructive"
      />
    </NavigationGuardContext.Provider>
  );
}
