import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllProducts } from '@/services/product.service';
import { MobileProductsClient } from './_components/mobile-products-client';

export default async function MobileProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const [t, { action }] = await Promise.all([getTranslations('products'), searchParams]);

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsData openAddForm={action === 'add'} />
      </Suspense>
    </div>
  );
}

async function ProductsData({ openAddForm }: { openAddForm: boolean }) {
  const products = await getAllProducts();
  return <MobileProductsClient initialData={products} openAddForm={openAddForm} />;
}

function ProductsSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded animate-shimmer" />
            <div className="h-2.5 w-1/3 rounded animate-shimmer" />
          </div>
          <div className="h-3 w-12 rounded animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
