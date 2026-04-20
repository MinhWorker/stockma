'use client';

import { usePathname } from '@/i18n/routing';
import { LocaleLink } from '@/components/locale-link';
import { cn } from '@/lib/utils';
import { PackagePlus, PackageMinus } from 'lucide-react';

interface PrimaryActionCardProps {
  href?: string;
  intent?: string;
  label: string;
  description: string;
  variant: 'inbound' | 'outbound';
  onClick?: () => void;
}

const STYLES = {
  inbound:  { 
    card: 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-200/60 shadow-md shadow-emerald-500/10 hover:from-emerald-100/60 hover:to-emerald-50/40 hover:shadow-lg hover:shadow-emerald-500/15', 
    icon: 'bg-emerald-500 shadow-sm shadow-emerald-500/40', 
    text: 'text-emerald-900', 
    sub: 'text-emerald-700/80', 
    badge: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40' 
  },
  outbound: { 
    card: 'bg-gradient-to-br from-rose-50/80 to-white border-rose-200/60 shadow-md shadow-rose-500/10 hover:from-rose-100/60 hover:to-rose-50/40 hover:shadow-lg hover:shadow-rose-500/15', 
    icon: 'bg-rose-500 shadow-sm shadow-rose-500/40', 
    text: 'text-rose-900', 
    sub: 'text-rose-700/80', 
    badge: 'bg-rose-500 text-white shadow-sm shadow-rose-500/40'    
  },
};

const BADGE = { inbound: '+', outbound: '−' };

export function PrimaryActionCard({ href, intent, label, description, variant, onClick }: PrimaryActionCardProps) {
  const Icon = variant === 'inbound' ? PackagePlus : PackageMinus;
  const pathname = usePathname();
  const styles = STYLES[variant];

  const sharedClass = cn(
    'group flex items-center justify-between rounded-2xl px-5 py-5 w-full',
    'border active:scale-[0.98] transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    styles.card
  );

  const inner = (
    <>
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', styles.icon)}>
          <Icon className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className={cn('text-base font-semibold leading-tight', styles.text)}>{label}</p>
          <p className={cn('mt-0.5 text-sm leading-snug', styles.sub)}>{description}</p>
        </div>
      </div>
      <div className={cn('ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl font-light', styles.badge)}>
        {BADGE[variant]}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(sharedClass, 'cursor-pointer text-left')}>
        {inner}
      </button>
    );
  }

  const params = new URLSearchParams({ back: pathname });
  if (intent) params.set('action', intent);

  return (
    <LocaleLink
      href={`${href}?${params.toString()}`}
      transitionTypes={['nav-forward']}
      className={sharedClass}
    >
      {inner}
    </LocaleLink>
  );
}
