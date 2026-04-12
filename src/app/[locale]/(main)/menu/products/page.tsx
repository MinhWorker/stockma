import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllProducts } from '@/services/product.service';
import { MobileProductsClient } from './_components/mobile-products-client';

export const dynamic = 'force-dynamic';

export default async function MobileProductsPage() {
  const t = await getTranslations('products');
  const products = await getAllProducts();

  return (
    <div className="space-y-0">
      <Suspense fallback={<ProductsSkeleton />}>
        <MobileProductsClient initialData={products} />
      </Suspense>
    </div>
  );
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
