import { Suspense } from 'react';
import { getAllProducts } from '@/services/product.service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StockInClient } from './_components/stock-in-client';
import { BulkStockInProvider } from './_context/bulk-stock-in-context';
import { BulkStockInCatalog } from './_components/bulk-stock-in-catalog';

export default async function StockInPage() {
  const products = await getAllProducts();

  return (
    <div className="space-y-0">
      <Tabs defaultValue="quick" className="px-4">
        <TabsList>
          <TabsTrigger value="quick">Nhập nhanh</TabsTrigger>
          <TabsTrigger value="bulk">Nhập hàng loạt</TabsTrigger>
        </TabsList>
        <TabsContent value="quick" className="px-0">
          <StockInClient />
        </TabsContent>
        <TabsContent value="bulk" className="px-0">
          <BulkStockInProvider>
            <Suspense fallback={<BulkCatalogSkeleton />}>
              <BulkStockInCatalog products={products} />
            </Suspense>
          </BulkStockInProvider>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BulkCatalogSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <div className="h-6 w-6 shrink-0 rounded-full animate-shimmer" />
          <div className="h-10 w-10 shrink-0 rounded-xl animate-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/5 rounded animate-shimmer" />
            <div className="h-2.5 w-1/4 rounded animate-shimmer" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="h-3 w-14 rounded animate-shimmer" />
            <div className="h-2.5 w-10 rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
