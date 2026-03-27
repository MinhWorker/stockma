'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DataTable, type ColumnDef } from '@/components/data-display/data-table';
import { EmptyState } from '@/components/data-display/empty-state';
import { SkeletonTable } from '@/components/feedback/skeleton-table';

export type ReportType = 'inventorySummary' | 'stockMovement' | 'lowStock' | 'valuation';

// --- Per-report row shapes ---

export interface InventorySummaryRow {
  productId: number;
  productName: string;
  category: string;
  currentStock: number;
  stockValue: number;
  turnoverRate: number;
}

export interface StockMovementRow {
  productId: number;
  productName: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
}

export interface LowStockRow {
  productId: number;
  productName: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
}

export interface ValuationRow {
  category: string;
  totalValue: number;
  productCount: number;
}

export type ReportData =
  | { type: 'inventorySummary'; rows: InventorySummaryRow[] }
  | { type: 'stockMovement'; rows: StockMovementRow[] }
  | { type: 'lowStock'; rows: LowStockRow[] }
  | { type: 'valuation'; rows: ValuationRow[] };

interface ReportViewerProps {
  reportType: ReportType | null;
  isLoading: boolean;
  data: ReportData | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

// --- Explicit variant components (no boolean prop switching) ---

function InventorySummaryViewer({ rows }: { rows: InventorySummaryRow[] }) {
  const t = useTranslations('reports');

  const columns: ColumnDef<InventorySummaryRow>[] = [
    {
      key: 'productName',
      header: t('columns.product'),
      cell: (r) => <span className="font-medium">{r.productName}</span>,
    },
    { key: 'category', header: t('columns.category'), cell: (r) => r.category },
    { key: 'currentStock', header: t('columns.currentStock'), cell: (r) => r.currentStock },
    {
      key: 'stockValue',
      header: t('columns.stockValue'),
      cell: (r) => formatCurrency(r.stockValue),
    },
    {
      key: 'turnoverRate',
      header: t('columns.turnoverRate'),
      cell: (r) => `${r.turnoverRate.toFixed(1)}x`,
    },
  ];

  const emptyState = (
    <EmptyState icon={BarChart3} title={t('emptyDataTitle')} description={t('emptyDataDesc')} />
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => String(r.productId)}
      emptyState={emptyState}
    />
  );
}

function StockMovementViewer({ rows }: { rows: StockMovementRow[] }) {
  const t = useTranslations('reports');

  const columns: ColumnDef<StockMovementRow>[] = [
    {
      key: 'productName',
      header: t('columns.product'),
      cell: (r) => <span className="font-medium">{r.productName}</span>,
    },
    { key: 'openingStock', header: t('columns.openingStock'), cell: (r) => r.openingStock },
    {
      key: 'stockIn',
      header: t('columns.stockIn'),
      cell: (r) => <span className="text-green-600">+{r.stockIn}</span>,
    },
    {
      key: 'stockOut',
      header: t('columns.stockOut'),
      cell: (r) => <span className="text-red-600">-{r.stockOut}</span>,
    },
    {
      key: 'closingStock',
      header: t('columns.closingStock'),
      cell: (r) => <span className="font-medium">{r.closingStock}</span>,
    },
  ];

  const emptyState = (
    <EmptyState icon={BarChart3} title={t('emptyDataTitle')} description={t('emptyDataDesc')} />
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => String(r.productId)}
      emptyState={emptyState}
    />
  );
}

function LowStockViewer({ rows }: { rows: LowStockRow[] }) {
  const t = useTranslations('reports');

  const columns: ColumnDef<LowStockRow>[] = [
    {
      key: 'productName',
      header: t('columns.product'),
      cell: (r) => <span className="font-medium">{r.productName}</span>,
    },
    { key: 'category', header: t('columns.category'), cell: (r) => r.category },
    {
      key: 'currentStock',
      header: t('columns.currentStock'),
      cell: (r) => (
        <span
          className={
            r.currentStock === 0 ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'
          }
        >
          {r.currentStock}
        </span>
      ),
    },
    { key: 'reorderLevel', header: t('columns.reorderLevel'), cell: (r) => r.reorderLevel },
  ];

  const emptyState = (
    <EmptyState icon={BarChart3} title={t('emptyDataTitle')} description={t('emptyDataDesc')} />
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => String(r.productId)}
      emptyState={emptyState}
    />
  );
}

function ValuationViewer({ rows }: { rows: ValuationRow[] }) {
  const t = useTranslations('reports');

  const columns: ColumnDef<ValuationRow>[] = [
    {
      key: 'category',
      header: t('columns.category'),
      cell: (r) => <span className="font-medium">{r.category}</span>,
    },
    { key: 'productCount', header: t('columns.product'), cell: (r) => r.productCount },
    {
      key: 'totalValue',
      header: t('columns.totalValue'),
      cell: (r) => formatCurrency(r.totalValue),
    },
  ];

  const emptyState = (
    <EmptyState icon={BarChart3} title={t('emptyDataTitle')} description={t('emptyDataDesc')} />
  );

  return (
    <DataTable columns={columns} data={rows} getRowId={(r) => r.category} emptyState={emptyState} />
  );
}

// --- Main controlled component ---

export function ReportViewer({ reportType, isLoading, data }: ReportViewerProps) {
  const t = useTranslations('reports');

  if (isLoading) {
    return <SkeletonTable rows={6} columns={5} />;
  }

  if (!data || reportType === null) {
    return <EmptyState icon={BarChart3} title={t('emptyTitle')} description={t('emptyDesc')} />;
  }

  if (data.type === 'inventorySummary') return <InventorySummaryViewer rows={data.rows} />;
  if (data.type === 'stockMovement') return <StockMovementViewer rows={data.rows} />;
  if (data.type === 'lowStock') return <LowStockViewer rows={data.rows} />;
  if (data.type === 'valuation') return <ValuationViewer rows={data.rows} />;
}
