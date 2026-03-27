import { useEffect, useState } from 'react';

const DESKTOP_BREAKPOINT = 1024;

type DeviceType = 'mobile' | 'desktop' | undefined;

export function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const update = () => setDevice(mql.matches ? 'desktop' : 'mobile');
    mql.addEventListener('change', update);
    update();
    return () => mql.removeEventListener('change', update);
  }, []);

  return device;
}

export function useIsDesktop() {
  return useDeviceType() === 'desktop';
}
