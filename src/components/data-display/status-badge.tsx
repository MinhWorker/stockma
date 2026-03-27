import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/types/product';
import type { TransactionType } from '@/types/transaction';

export type UserStatus = 'active' | 'inactive';

export type StatusValue = ProductStatus | TransactionType | UserStatus;

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border',
  {
    variants: {
      variant: {
        green:
          'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
        yellow:
          'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
        red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        gray: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700',
      },
    },
    defaultVariants: {
      variant: 'gray',
    },
  }
);

const STATUS_VARIANT_MAP: Record<StatusValue, VariantProps<typeof statusBadgeVariants>['variant']> =
  {
    active: 'green',
    low_stock: 'yellow',
    out_of_stock: 'red',
    stock_in: 'green',
    stock_out: 'red',
    adjustment: 'blue',
    inactive: 'gray',
  };

const STATUS_LABEL_MAP: Record<StatusValue, string> = {
  active: 'Active',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  adjustment: 'Adjustment',
  inactive: 'Inactive',
};

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANT_MAP[status];
  const label = STATUS_LABEL_MAP[status];

  return <span className={cn(statusBadgeVariants({ variant }), className)}>{label}</span>;
}
