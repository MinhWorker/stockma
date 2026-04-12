import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllCategories } from '@/services/category.service';
import { MobileCategoriesClient } from './_components/mobile-categories-client';

export default async function MobileCategoriesPage() {
  const t = await getTranslations('categories');
  const categoriesPromise = getAllCategories();

  return (
    <div className="space-y-0">
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesData categoriesPromise={categoriesPromise} />
      </Suspense>
    </div>
  );
}

async function CategoriesData({
  categoriesPromise,
}: {
  categoriesPromise: ReturnType<typeof getAllCategories>;
}) {
  const categories = await categoriesPromise;
  return <MobileCategoriesClient initialData={categories} />;
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* Category icon */}
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            {/* Name */}
            <div className="h-3 w-2/5 rounded-md animate-shimmer" />
            {/* Product count */}
            <div className="h-2.5 w-1/5 rounded-md animate-shimmer" />
          </div>
          {/* Chevron */}
          <div className="h-4 w-4 rounded-md animate-shimmer shrink-0" />
        </div>
      ))}
    </div>
  );
}
