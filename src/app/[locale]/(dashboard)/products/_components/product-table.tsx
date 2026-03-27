'use client';

import { useTranslations } from 'next-intl';
import { DataTable, type ColumnDef } from '@/components/data-display/data-table';
import { StatusBadge } from '@/components/data-display/status-badge';
import type { ProductSummary } from '@/services/types';

interface ProductTableProps {
  data: ProductSummary[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onView: (product: ProductSummary) => void;
  onEdit: (product: ProductSummary) => void;
  onDelete: (product: ProductSummary) => void;
}

export function ProductTable({
  data,
  isLoading,
  emptyState,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const t = useTranslations('products');

  const columns: ColumnDef<ProductSummary>[] = [
    {
      key: 'name',
      header: t('columns.name'),
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    { key: 'category', header: t('columns.category'), cell: (row) => row.categoryName },
    { key: 'stock', header: t('columns.stock'), cell: (row) => row.stockQty },
    {
      key: 'price',
      header: t('columns.price'),
      cell: (row) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(row.price),
    },
    {
      key: 'status',
      header: t('columns.status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      getRowId={(row) => String(row.id)}
      emptyState={emptyState}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      rowActions={(row) => [
        { label: 'View', onClick: () => onView(row) },
        { label: 'Edit', onClick: () => onEdit(row) },
        { label: 'Delete', onClick: () => onDelete(row), destructive: true },
      ]}
    />
  );
}
