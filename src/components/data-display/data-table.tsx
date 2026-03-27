'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/feedback/skeleton-table';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  cell: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  getRowId: (row: T) => string;
  rowActions?: (row: T) => { label: string; onClick: () => void; destructive?: boolean }[];
  emptyState?: React.ReactNode;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  getRowId,
  rowActions,
  emptyState,
  selectedIds,
  onSelectionChange,
  onRowClick,
}: DataTableProps<T>) {
  const hasSelection = onSelectionChange !== undefined;
  const hasActions = rowActions !== undefined;

  const totalColumns = columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0);

  const allSelected =
    data.length > 0 &&
    selectedIds !== undefined &&
    data.every((row) => selectedIds.includes(getRowId(row)));

  const someSelected = selectedIds !== undefined && selectedIds.length > 0 && !allSelected;

  function handleSelectAll(checked: boolean) {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(data.map(getRowId));
    } else {
      onSelectionChange([]);
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    if (!onSelectionChange || !selectedIds) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    }
  }

  if (isLoading) {
    return <SkeletonTable rows={5} columns={totalColumns} />;
  }

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {hasSelection && (
              <TableHead className="w-10">
                <Checkbox
                  checked={someSelected ? 'indeterminate' : allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead key={col.key}>{col.header}</TableHead>
            ))}
            {hasActions && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={totalColumns} className="p-0">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const id = getRowId(row);
              const isSelected = selectedIds?.includes(id) ?? false;
              const actions = rowActions?.(row) ?? [];

              return (
                <TableRow
                  key={id}
                  data-state={isSelected ? 'selected' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  {hasSelection && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(id, checked === true)}
                        aria-label={`Select row ${id}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>{col.cell(row)}</TableCell>
                  ))}
                  {hasActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action) => (
                            <DropdownMenuItem
                              key={action.label}
                              onClick={action.onClick}
                              variant={action.destructive ? 'destructive' : 'default'}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
