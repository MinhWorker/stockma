'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { formatDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getDebtGroupsAction, addPaymentAction, closeDebtAction } from '@/actions/debt.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import type { DebtGroupSummary, DebtStatus } from '@/services/types';

const STATUS_LABELS: Record<DebtStatus, string> = {
  open: 'Đang nợ',
  closed: 'Đã đóng',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<DebtStatus, string> = {
  open: 'text-amber-600',
  closed: 'text-emerald-600',
  cancelled: 'text-muted-foreground',
};

export function DebtList() {
  const tCommon = useTranslations('common');
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  const amountId = useId();
  const noteId = useId();

  const [statusFilter, setStatusFilter] = useState<DebtStatus | 'all'>('all');
  const [debts, setDebts] = useState<DebtGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment dialog state
  const [paymentDebtId, setPaymentDebtId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Close debt loading
  const [closingId, setClosingId] = useState<number | null>(null);

  async function loadDebts() {
    setLoading(true);
    try {
      const result = await getDebtGroupsAction(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
      );
      setDebts(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function openPaymentDialog(debtId: number) {
    setPaymentDebtId(debtId);
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentError('');
  }

  function closePaymentDialog() {
    setPaymentDebtId(null);
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentError('');
  }

  const handleAddPayment = useCallback(async () => {
    if (!paymentDebtId) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError('Số tiền phải > 0');
      return;
    }
    setPaymentSubmitting(true);
    try {
      const result = await addPaymentAction(
        paymentDebtId,
        amount,
        paymentNote || undefined,
        userId
      );
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success('Đã thêm thanh toán');
      closePaymentDialog();
      await loadDebts();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setPaymentSubmitting(false);
    }
  }, [paymentDebtId, paymentAmount, paymentNote, userId, tCommon]);

  const handleCloseDebt = useCallback(async (debtId: number) => {
    setClosingId(debtId);
    try {
      const result = await closeDebtAction(debtId, userId);
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success('Đã đóng nợ');
      await loadDebts();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setClosingId(null);
    }
  }, [userId, tCommon]);

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium shrink-0">Trạng thái:</p>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DebtStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="open">Đang nợ</SelectItem>
            <SelectItem value="closed">Đã đóng</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : debts.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Không có khoản nợ nào
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => (
            <div key={debt.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{debt.debtorName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(debt.createdAt)}
                  </p>
                </div>
                <span className={`text-xs font-medium shrink-0 ${STATUS_COLORS[debt.status]}`}>
                  {STATUS_LABELS[debt.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tổng nợ</p>
                  <p className="font-medium">{debt.totalAmount.toLocaleString('vi-VN')}đ</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đã trả</p>
                  <p className="font-medium text-emerald-600">
                    {debt.paidAmount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Còn lại</p>
                  <p className="font-medium text-amber-600">
                    {debt.remainingAmount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>

              {debt.status === 'open' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openPaymentDialog(debt.id)}
                  >
                    Thêm thanh toán
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCloseDebt(debt.id)}
                    disabled={closingId === debt.id}
                  >
                    {closingId === debt.id && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    Đóng nợ
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={paymentDebtId !== null} onOpenChange={(open) => !open && closePaymentDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm thanh toán</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Số tiền" required error={paymentError} htmlFor={amountId}>
              <Input
                id={amountId}
                type="number"
                min={1}
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setPaymentError('');
                }}
                placeholder="Nhập số tiền..."
                aria-invalid={!!paymentError}
              />
            </FormField>
            <FormField label="Ghi chú" htmlFor={noteId}>
              <Input
                id={noteId}
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Ghi chú (tùy chọn)"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePaymentDialog} disabled={paymentSubmitting}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleAddPayment} disabled={paymentSubmitting}>
              {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
