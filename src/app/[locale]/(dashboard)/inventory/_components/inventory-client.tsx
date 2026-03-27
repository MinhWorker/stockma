'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus, Warehouse } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ActionBar } from '@/components/layout/action-bar';
import { DataTable, type ColumnDef } from '@/components/data-display/data-table';
import { DataTableToolbar } from '@/components/data-display/data-table-toolbar';
import { DataTablePagination } from '@/components/data-display/data-table-pagination';
import { StatusBadge } from '@/components/data-display/status-badge';
import { EmptyState } from '@/components/data-display/empty-state';
import { TransactionForm } from '@/app/[locale]/(dashboard)/inventory/_components/transaction-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import type { TransactionRecord, TransactionType } from '@/services/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;
type TabValue = 'all' | TransactionType;

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface Props {
  initialData: TransactionRecord[];
}

export function InventoryClient({ initialData }: Props) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');

  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
    return initialData.filter((tx) => {
      const matchesTab = activeTab === 'all' || tx.type === activeTab;
      const matchesSearch = !q || tx.productName.toLowerCase().includes(q);
      const txTime = tx.createdAt.getTime();
      return matchesTab && matchesSearch && (!from || txTime >= from) && (!to || txTime <= to);
    });
  }, [initialData, activeTab, search, dateFrom, dateTo]);

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
      key: 'date',
      header: t('columns.date'),
      cell: (row) => <span className="whitespace-nowrap text-sm">{formatDate(row.createdAt)}</span>,
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
      key: 'note',
      header: t('columns.note'),
      cell: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-[160px] block">
          {row.note || '-'}
        </span>
      ),
    },
    {
      key: 'user',
      header: t('columns.user'),
      cell: (row) => <span className="text-sm">{row.userName ?? '-'}</span>,
    },
  ];

  const hasFilters = search !== '' || dateFrom !== '' || dateTo !== '' || activeTab !== 'all';

  const emptyState = (
    <EmptyState
      icon={Warehouse}
      title={hasFilters ? t('emptyFilterTitle') : t('emptyTitle')}
      description={hasFilters ? t('emptyFilterDesc') : t('emptyDesc')}
      action={
        hasFilters
          ? {
              label: tCommon('clearFilters'),
              onClick: () => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
                setActiveTab('all');
              },
            }
          : { label: t('newTransaction'), onClick: () => setFormOpen(true) }
      }
    />
  );

  return (
    <>
      <ActionBar
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newTransaction')}
          </Button>
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TabValue);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
            <TabsTrigger value="stock_in">{t('tabs.stockIn')}</TabsTrigger>
            <TabsTrigger value="stock_out">{t('tabs.stockOut')}</TabsTrigger>
            <TabsTrigger value="adjustment">{t('tabs.adjustments')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </ActionBar>

      <DataTableToolbar
        search={search}
        onSearchChange={handleSearchChange}
        placeholder={t('searchPlaceholder')}
        filters={
          <>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              aria-label={t('dateFrom')}
              className="w-36"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              aria-label={t('dateTo')}
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

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => setFormOpen(false)}
      />
    </>
  );
}
