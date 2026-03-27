import { DeviceRedirect } from '@/components/device-redirect';

// Server component — renders a client redirect component that checks device type:
// desktop → /dashboard, mobile → /menu
export default function LocaleRootPage() {
  return <DeviceRedirect />;
}
