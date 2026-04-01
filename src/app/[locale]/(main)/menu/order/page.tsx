import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllProducts } from '@/services/product.service';
import { OrderProvider } from './_context/order-context';
import { OrderCatalog } from './_components/order-catalog';

export const dynamic = 'force-dynamic';

export default async function OrderPage() {
  const [products, t] = await Promise.all([getAllProducts(), getTranslations('order')]);
  // Only show products that have stock
  const available = products.filter((p) => p.stockQty > 0);

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <OrderProvider>
        <Suspense fallback={<CatalogSkeleton />}>
          <OrderCatalog products={available} />
        </Suspense>
      </OrderProvider>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-6 w-6 rounded-full animate-shimmer shrink-0" />
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/5 rounded animate-shimmer" />
            <div className="h-2.5 w-1/4 rounded animate-shimmer" />
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="h-3 w-14 rounded animate-shimmer" />
            <div className="h-2.5 w-10 rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
