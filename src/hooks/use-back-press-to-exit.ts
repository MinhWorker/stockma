'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useBackPressToExit(message = 'Press again to close app') {
  const pressedOnce = useRef(false);

  useEffect(() => {
    // Push a dummy history entry so the back button has something to pop
    window.history.pushState({ backPressGuard: true }, '');

    const onPopState = () => {
      if (pressedOnce.current) {
        window.close();
        return;
      }

      pressedOnce.current = true;
      // Re-push so the back button is interceptable again
      window.history.pushState({ backPressGuard: true }, '');
      toast(message);

      setTimeout(() => {
        pressedOnce.current = false;
      }, 2000);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [message]);
}
