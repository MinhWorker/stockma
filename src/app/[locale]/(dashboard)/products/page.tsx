import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllProducts } from '@/services/product.service';
import { getAllCategories } from '@/services/category.service';
import { PageHeader } from '@/components/layout/page-header';
import { ProductsClient } from '@/app/[locale]/(dashboard)/products/_components/products-client';

export default async function ProductsPage() {
  const t = await getTranslations('products');
  return (
    <div className="space-y-4">
      <PageHeader title={t('title')} />
      <Suspense
        fallback={<div className="h-96 rounded-xl border border-border animate-pulse bg-muted" />}
      >
        <ProductsData />
      </Suspense>
    </div>
  );
}

async function ProductsData() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);
  return (
    <ProductsClient
      initialData={products}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
