'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ActionBar } from '@/components/layout/action-bar';
import { DataTable, type ColumnDef } from '@/components/data-display/data-table';
import { DataTableToolbar } from '@/components/data-display/data-table-toolbar';
import { DataTablePagination } from '@/components/data-display/data-table-pagination';
import { StatusBadge } from '@/components/data-display/status-badge';
import { EmptyState } from '@/components/data-display/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TransactionRecord, TransactionType } from '@/services/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;
type TypeFilter = 'all' | TransactionType;

function formatDateTime(d: Date) {
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  initialData: TransactionRecord[];
}

export function TransactionsClient({ initialData }: Props) {
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [detailTx, setDetailTx] = useState<TransactionRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
    return initialData.filter((tx) => {
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesSearch =
        !q || String(tx.id).includes(q) || tx.productName.toLowerCase().includes(q);
      const txTime = tx.createdAt.getTime();
      return matchesType && matchesSearch && (!from || txTime >= from) && (!to || txTime <= to);
    });
  }, [initialData, typeFilter, search, dateFrom, dateTo]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const columns: ColumnDef<TransactionRecord>[] = [
    {
      key: 'id',
      header: t('columns.id'),
      cell: (row) => <span className="text-muted-foreground text-sm font-mono">#{row.id}</span>,
    },
    {
      key: 'date',
      header: t('columns.date'),
      cell: (row) => (
        <span className="whitespace-nowrap text-sm">{formatDateTime(row.createdAt)}</span>
      ),
    },
    { key: 'type', header: t('columns.type'), cell: (row) => <StatusBadge status={row.type} /> },
    {
      key: 'product',
      header: t('columns.product'),
      cell: (row) => <p className="font-medium text-sm">{row.productName}</p>,
    },
    {
      key: 'quantity',
      header: t('columns.quantity'),
      cell: (row) => (
        <span className={row.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      key: 'stockBefore',
      header: t('columns.stockBefore'),
      cell: (row) => <span className="text-muted-foreground">{row.stockBefore}</span>,
    },
    {
      key: 'stockAfter',
      header: t('columns.stockAfter'),
      cell: (row) => <span>{row.stockAfter}</span>,
    },
    {
      key: 'user',
      header: t('columns.user'),
      cell: (row) => <span className="text-sm">{row.userName ?? '-'}</span>,
    },
    {
      key: 'note',
      header: t('columns.note'),
      cell: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-[160px] block">
          {row.note || '-'}
        </span>
      ),
    },
  ];

  const hasFilters = search !== '' || typeFilter !== 'all' || dateFrom !== '' || dateTo !== '';

  const emptyState = (
    <EmptyState
      icon={ArrowLeftRight}
      title={hasFilters ? t('emptyFilterTitle') : t('emptyTitle')}
      description={hasFilters ? t('emptyFilterDesc') : t('emptyDesc')}
      action={
        hasFilters
          ? {
              label: tCommon('clearFilters'),
              onClick: () => {
                setSearch('');
                setTypeFilter('all');
                setDateFrom('');
                setDateTo('');
              },
            }
          : undefined
      }
    />
  );

  return (
    <>
      <ActionBar
        action={
          <Button variant="outline" onClick={() => toast.info(t('exportInitiated'))}>
            <Download className="mr-2 size-4" />
            {t('exportCsv')}
          </Button>
        }
      >
        <span />
      </ActionBar>

      <DataTableToolbar
        search={search}
        onSearchChange={handleSearchChange}
        placeholder={t('searchPlaceholder')}
        filters={
          <>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v as TypeFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36" aria-label={t('filterType')}>
                <SelectValue placeholder={t('allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="stock_in">{tStatus('stockIn')}</SelectItem>
                <SelectItem value="stock_out">{tStatus('stockOut')}</SelectItem>
                <SelectItem value="adjustment">{tStatus('adjustment')}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              aria-label="Date from"
              className="w-36"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              aria-label="Date to"
              className="w-36"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={paginated}
        getRowId={(row) => String(row.id)}
        emptyState={emptyState}
        onRowClick={setDetailTx}
      />

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

      <Dialog
        open={detailTx !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTx(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.title')}</DialogTitle>
          </DialogHeader>
          {detailTx && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">{t('detail.transactionId')}</dt>
              <dd className="font-mono">#{detailTx.id}</dd>
              <dt className="text-muted-foreground">{t('detail.date')}</dt>
              <dd>{formatDateTime(detailTx.createdAt)}</dd>
              <dt className="text-muted-foreground">{t('detail.type')}</dt>
              <dd>
                <StatusBadge status={detailTx.type} />
              </dd>
              <dt className="text-muted-foreground">{t('detail.product')}</dt>
              <dd>{detailTx.productName}</dd>
              <dt className="text-muted-foreground">{t('detail.quantity')}</dt>
              <dd className={detailTx.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
                {detailTx.quantity > 0 ? `+${detailTx.quantity}` : detailTx.quantity}
              </dd>
              <dt className="text-muted-foreground">{t('detail.stockBefore')}</dt>
              <dd>{detailTx.stockBefore}</dd>
              <dt className="text-muted-foreground">{t('detail.stockAfter')}</dt>
              <dd>{detailTx.stockAfter}</dd>
              <dt className="text-muted-foreground">{t('detail.user')}</dt>
              <dd>{detailTx.userName ?? '-'}</dd>
              <dt className="text-muted-foreground">{t('detail.note')}</dt>
              <dd className="col-span-2">{detailTx.note || '-'}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
