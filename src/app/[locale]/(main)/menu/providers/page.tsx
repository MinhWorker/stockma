import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllProviders } from '@/services/provider.service';
import { MobileProvidersClient } from './_components/mobile-providers-client';

export default async function MobileProvidersPage() {
  const t = await getTranslations('providers');
  const providersPromise = getAllProviders();

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<ProvidersSkeleton />}>
        <ProvidersData providersPromise={providersPromise} />
      </Suspense>
    </div>
  );
}

async function ProvidersData({ providersPromise }: { providersPromise: ReturnType<typeof getAllProviders> }) {
  const providers = await providersPromise;
  return <MobileProvidersClient initialData={providers} />;
}

function ProvidersSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* Provider avatar */}
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            {/* Name */}
            <div className="h-3 w-2/5 rounded-md animate-shimmer" />
            {/* Contact info */}
            <div className="h-2.5 w-1/3 rounded-md animate-shimmer" />
          </div>
          {/* Chevron */}
          <div className="h-4 w-4 rounded-md animate-shimmer shrink-0" />
        </div>
      ))}
    </div>
  );
}
