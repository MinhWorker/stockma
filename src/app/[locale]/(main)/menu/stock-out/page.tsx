import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StockOutClient } from './_components/stock-out-client';
import { ReturnForm } from './_components/return-form';

export default async function StockOutPage() {
  return (
    <div className="space-y-0">
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
