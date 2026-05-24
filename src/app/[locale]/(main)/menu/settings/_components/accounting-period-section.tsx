'use client';

import { useMemo, useState, useTransition } from 'react';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { closeAccountingPeriodAction } from '@/actions/accounting-period.action';
import { SettingsSection } from './settings-section';
import { SettingsRow } from './settings-row';

type AccountingPeriod = {
  id: number;
  name: string | null;
  startAt: Date;
  endAt: Date | null;
  status: string;
};

type ClosePreview = {
  stockItems: number;
  stockQty: number;
  openDebtCount: number;
  openDebtAmount: number;
};

interface Props {
  currentPeriod: AccountingPeriod | null;
  preview: ClosePreview;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultNextStartValue(endAtValue: string): string {
  const endAt = new Date(endAtValue);
  endAt.setDate(endAt.getDate() + 1);
  endAt.setHours(0, 0, 0, 0);
  return toDatetimeLocalValue(endAt);
}

function formatDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AccountingPeriodSection({ currentPeriod, preview }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const defaultEndAt = useMemo(() => toDatetimeLocalValue(new Date()), []);
  const [endAt, setEndAt] = useState(defaultEndAt);
  const [nextStartAt, setNextStartAt] = useState(defaultNextStartValue(defaultEndAt));

  const endDate = new Date(endAt);
  const nextStartDate = new Date(nextStartAt);
  const overlaps = currentPeriod && nextStartDate <= endDate;
  const closesBeforeStart = currentPeriod && endDate < currentPeriod.startAt;

  function handleEndAtChange(value: string) {
    setEndAt(value);
    setNextStartAt(defaultNextStartValue(value));
  }

  function handleClosePeriod() {
    startTransition(async () => {
      const result = await closeAccountingPeriodAction({
        endAt: new Date(endAt).toISOString(),
        nextStartAt: new Date(nextStartAt).toISOString(),
      });

      if (!result.success) {
        toast.error(result.error ?? 'Không thể kết kỳ');
        return;
      }

      toast.success('Đã kết kỳ và mở kỳ kế toán mới');
      setOpen(false);
    });
  }

  return (
    <>
      <SettingsSection title="Kỳ kế toán">
        <SettingsRow
          type="action"
          label={currentPeriod ? 'Kỳ đang mở' : 'Chưa có kỳ đang mở'}
          description={currentPeriod ? `Bắt đầu ${formatDateTime(currentPeriod.startAt)}` : 'Cần tạo kỳ trước khi ghi giao dịch mới'}
          value={currentPeriod ? `#${currentPeriod.id}` : undefined}
          onClick={currentPeriod ? () => setOpen(true) : undefined}
        />
      </SettingsSection>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">Kết kỳ kế toán</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">
                  {currentPeriod ? `Kỳ #${currentPeriod.id}` : 'Kỳ hiện tại'}
                </p>
              </div>
              {currentPeriod && (
                <p className="text-xs text-muted-foreground">Mở từ {formatDateTime(currentPeriod.startAt)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <PreviewTile label="Mặt hàng chuyển" value={String(preview.stockItems)} />
              <PreviewTile label="Số lượng tồn" value={String(preview.stockQty)} />
              <PreviewTile label="Công nợ mở" value={String(preview.openDebtCount)} />
              <PreviewTile label="Giá trị nợ" value={formatPrice(preview.openDebtAmount)} />
            </div>

            <div className="space-y-3">
              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-muted-foreground">Thời điểm kết kỳ</span>
                <Input
                  type="datetime-local"
                  value={endAt}
                  min={currentPeriod ? toDatetimeLocalValue(currentPeriod.startAt) : undefined}
                  onChange={(event) => handleEndAtChange(event.target.value)}
                />
              </label>
              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-muted-foreground">Thời điểm mở kỳ mới</span>
                <Input
                  type="datetime-local"
                  value={nextStartAt}
                  min={endAt}
                  onChange={(event) => setNextStartAt(event.target.value)}
                />
              </label>
              {closesBeforeStart && (
                <p className="text-xs text-destructive">Thời điểm kết kỳ không thể trước lúc mở kỳ.</p>
              )}
              {overlaps && (
                <p className="text-xs text-destructive">Kỳ mới phải bắt đầu sau thời điểm kết kỳ cũ.</p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleClosePeriod}
              disabled={!currentPeriod || Boolean(overlaps) || Boolean(closesBeforeStart) || isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending ? 'Đang kết kỳ...' : 'Kết kỳ và mở kỳ mới'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function PreviewTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-sm font-semibold tabular-nums mt-1">{value}</p>
    </div>
  );
}
