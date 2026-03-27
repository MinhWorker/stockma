'use client';

import { useCallback, useMemo, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ActionBar } from '@/components/layout/action-bar';
import { DataTableToolbar } from '@/components/data-display/data-table-toolbar';
import { DataTablePagination } from '@/components/data-display/data-table-pagination';
import { EmptyState } from '@/components/data-display/empty-state';
import { ConfirmDialog } from '@/components/feedback/confirm-dialog';
import { ProductTable } from '@/app/[locale]/(dashboard)/products/_components/product-table';
import { ProductForm } from '@/app/[locale]/(dashboard)/products/_components/product-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteProductAction } from '@/actions/products.action';
import type { ProductSummary, ProductStatus } from '@/services/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;

const STATUSES: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

interface Props {
  initialData: ProductSummary[];
  categories: { id: number; name: string }[];
}

export function ProductsClient({ initialData, categories }: Props) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSummary | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductSummary | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialData.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || p.categoryId === Number(categoryFilter);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [initialData, search, categoryFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const result = await deleteProductAction(deletingProduct.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('deleteSuccess'));
      setDeleteDialogOpen(false);
      setDeletingProduct(undefined);
    } finally {
      setIsDeleting(false);
    }
  }, [deletingProduct, t]);

  const hasFilters = search !== '' || categoryFilter !== 'all' || statusFilter !== 'all';

  const emptyState = (
    <EmptyState
      icon={Package}
      title={hasFilters ? t('emptyFilterTitle') : t('emptyTitle')}
      description={hasFilters ? t('emptyFilterDesc') : t('emptyDesc')}
      action={
        hasFilters
          ? {
              label: tCommon('clearFilters'),
              onClick: () => {
                setSearch('');
                setCategoryFilter('all');
                setStatusFilter('all');
              },
            }
          : {
              label: t('addProduct'),
              onClick: () => {
                setEditingProduct(undefined);
                setFormOpen(true);
              },
            }
      }
    />
  );

  return (
    <>
      <ActionBar
        action={
          <Button
            onClick={() => {
              setEditingProduct(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            {t('addProduct')}
          </Button>
        }
      >
        <DataTableToolbar
          search={search}
          onSearchChange={handleSearchChange}
          placeholder={t('searchPlaceholder')}
          filters={
            <>
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('filterCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t('filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          selectedCount={selectedIds.length}
        />
      </ActionBar>

      <ProductTable
        data={paginated}
        emptyState={emptyState}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onView={(p) => {
          setEditingProduct(p);
          setFormOpen(true);
        }}
        onEdit={(p) => {
          setEditingProduct(p);
          setFormOpen(true);
        }}
        onDelete={(p) => {
          setDeletingProduct(p);
          setDeleteDialogOpen(true);
        }}
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

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        categories={categories}
        onSuccess={() => {
          setFormOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDesc', { name: deletingProduct?.name ?? '' })}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
      />
    </>
  );
}
