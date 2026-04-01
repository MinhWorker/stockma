'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resetAppDataAction } from '@/actions/dev.action';

export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    try {
      const result = await resetAppDataAction();
      if (!result.success) {
        toast.error(result.error ?? 'Đã có lỗi xảy ra');
        return;
      }
      toast.success('Đã xóa toàn bộ dữ liệu');
      setConfirming(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-1">
      <p className="px-4 text-xs font-semibold uppercase tracking-wider text-destructive">
        Danger Zone
      </p>
      <div className="border-y border-destructive/30 bg-destructive/5 px-4 py-4 space-y-3">
        <div className="flex items-start gap-2 text-destructive">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">
            Reset sẽ xóa toàn bộ sản phẩm, phân loại, giao dịch, công nợ và lịch sử hoạt động.
            Danh mục, nhà cung cấp và kho hàng sẽ được giữ lại. Hành động này không thể hoàn tác.
          </p>
        </div>

        {!confirming ? (
          <Button
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setConfirming(true)}
          >
            Reset dữ liệu ứng dụng
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-center text-destructive">
              Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirming(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReset}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận xóa
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
