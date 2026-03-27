'use client';

import { useTranslations } from 'next-intl';
import { DataTable, type ColumnDef } from '@/components/data-display/data-table';
import { StatusBadge } from '@/components/data-display/status-badge';
import { EmptyState } from '@/components/data-display/empty-state';
import { Users } from 'lucide-react';
import type { User } from '@/types/user';

interface UserTableProps {
  data: User[];
  isLoading?: boolean;
}

export function UserTable({ data, isLoading }: UserTableProps) {
  const t = useTranslations('settings.users');
  const tStatus = useTranslations('status');

  const columns: ColumnDef<User>[] = [
    {
      key: 'name',
      header: t('columns.name'),
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'email',
      header: t('columns.email'),
      cell: (row) => row.email,
    },
    {
      key: 'role',
      header: t('columns.role'),
      cell: (row) => tStatus(row.role),
    },
    {
      key: 'status',
      header: t('columns.status'),
      cell: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
  ];

  function rowActions(row: User) {
    return [
      {
        label: t('actions.editRole'),
        onClick: () => {},
      },
      {
        label: row.isActive ? t('actions.deactivate') : t('actions.activate'),
        onClick: () => {},
        destructive: row.isActive,
      },
    ];
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      getRowId={(row) => String(row.id)}
      rowActions={rowActions}
      emptyState={<EmptyState icon={Users} title={t('title')} description={t('desc')} />}
    />
  );
}
