import { getTranslations } from 'next-intl/server';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StockOutClient } from './_components/stock-out-client';
import { ReturnForm } from './_components/return-form';

export default async function StockOutPage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('tabs.stockOut')}</h1>
      <Tabs defaultValue="stock-out" className="px-4">
        <TabsList>
          <TabsTrigger value="stock-out">Xuất kho</TabsTrigger>
          <TabsTrigger value="return">Đổi trả</TabsTrigger>
        </TabsList>
        <TabsContent value="stock-out" className="px-0">
          <StockOutClient />
        </TabsContent>
        <TabsContent value="return" className="px-0">
          <ReturnForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
