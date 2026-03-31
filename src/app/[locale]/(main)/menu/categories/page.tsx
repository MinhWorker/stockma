import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllCategories } from '@/services/category.service';
import { MobileCategoriesClient } from './_components/mobile-categories-client';

export default async function MobileCategoriesPage() {
  const t = await getTranslations('categories');
  const categoriesPromise = getAllCategories();

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
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
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded animate-shimmer" />
            <div className="h-2.5 w-1/4 rounded animate-shimmer" />
          </div>
          <div className="h-3 w-6 rounded animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
