import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllProducts } from '@/services/product.service';
import { MobileProductsClient } from './_components/mobile-products-client';

export const dynamic = 'force-dynamic';

export default async function MobileProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const t = await getTranslations('products');
  const productsPromise = getAllProducts();

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsData
          productsPromise={productsPromise}
          searchParamsPromise={searchParams}
        />
      </Suspense>
    </div>
  );
}

async function ProductsData({
  productsPromise,
  searchParamsPromise,
}: {
  productsPromise: ReturnType<typeof getAllProducts>;
  searchParamsPromise: Promise<{ action?: string }>;
}) {
  const [products, { action }] = await Promise.all([productsPromise, searchParamsPromise]);
  return <MobileProductsClient initialData={products} openAddForm={action === 'add'} />;
}

function ProductsSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* Product image */}
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            {/* Product name */}
            <div className="h-3 w-3/5 rounded-md animate-shimmer" />
            {/* Category + stock */}
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-16 rounded-md animate-shimmer" />
              <div className="h-2.5 w-10 rounded-full animate-shimmer" />
            </div>
          </div>
          {/* Price */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="h-3 w-14 rounded-md animate-shimmer" />
            <div className="h-2.5 w-8 rounded-md animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
