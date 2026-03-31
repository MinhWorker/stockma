'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart3, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { generateReportAction, type ReportType, type ReportRow } from '@/actions/reports.action';
import { getErrorKey } from '@/lib/error-message';

export function MobileReportsClient() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');

  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [rows, setRows] = useState<ReportRow[] | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!reportType) return;
    setIsGenerating(true);
    setRows(null);
    try {
      const result = await generateReportAction({
        type: reportType,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      setRows(result.data ?? []);
    } finally {
      setIsGenerating(false);
    }
  }, [reportType, dateFrom, dateTo]);

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="space-y-3">
        <Select
          value={reportType}
          onValueChange={(v) => {
            setReportType(v as ReportType);
            setRows(null);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('reportTypePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inventorySummary">{t('types.inventorySummary')}</SelectItem>
            <SelectItem value="stockMovement">{t('types.stockMovement')}</SelectItem>
            <SelectItem value="lowStock">{t('types.lowStock')}</SelectItem>
            <SelectItem value="valuation">{t('types.valuation')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('dateFrom')}</p>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('dateTo')}</p>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleGenerate} disabled={!reportType || isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('generating')}
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('generate')}
            </>
          )}
        </Button>
      </div>

      {rows && (
        <>
          <Separator />
          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground flex-1 pr-4">{row.label}</span>
                <span className="text-sm font-semibold tabular-nums">{row.value}</span>
                <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground/40 shrink-0" />
              </div>
            ))}
          </div>
        </>
      )}

      {!rows && !isGenerating && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-muted-foreground">{t('emptyDesc')}</p>
        </div>
      )}
    </div>
  );
}
