import { useTranslations } from 'next-intl';
import Image from 'next/image';
import logo from '../../../public/web-app-manifest-192x192.png';

export default function Loading() {
  const t = useTranslations();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      {/* Logo with pulse */}
      <div className="animate-pulse">
        <Image src={logo} alt="logo" width={64} height={64} priority />
      </div>

      {/* App title */}
      <span
        className="text-2xl font-bold tracking-[0.3em] text-foreground"
        style={{ letterSpacing: '0.3em' }}
      >
        STOCKMA
      </span>

      {/* Animated dots bar */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* Loading text */}
      <p className="text-sm text-muted-foreground">{t('loading.message')}</p>
    </div>
  );
}
