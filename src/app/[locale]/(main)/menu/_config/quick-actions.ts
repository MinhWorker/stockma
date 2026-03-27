export interface QuickAction {
  id: string;
  labelKey: string;
  descriptionKey: string;
  href: string;
  color: string;
  /** Optional intent param passed to destination page (e.g. "stock_in" for inventory page) */
  intent?: string;
}

export interface ActionGroup {
  groupKey: string;
  actions: QuickAction[];
}

export const ACTION_GROUPS: ActionGroup[] = [
  {
    groupKey: 'warehouse',
    actions: [
      {
        id: 'stock-in',
        labelKey: 'stockIn',
        descriptionKey: 'stockInDesc',
        href: '/menu/stock-in',
        color: 'bg-emerald-500',
        intent: 'stock_in',
      },
      {
        id: 'stock-out',
        labelKey: 'stockOut',
        descriptionKey: 'stockOutDesc',
        href: '/menu/stock-out',
        color: 'bg-rose-500',
        intent: 'stock_out',
      },
      {
        id: 'adjustment',
        labelKey: 'adjustment',
        descriptionKey: 'adjustmentDesc',
        href: '/menu/adjustment',
        color: 'bg-amber-500',
        intent: 'adjustment',
      },
      {
        id: 'inventory',
        labelKey: 'inventory',
        descriptionKey: 'inventoryDesc',
        href: '/menu/inventory',
        color: 'bg-blue-500',
      },
    ],
  },
  {
    groupKey: 'catalog',
    actions: [
      {
        id: 'products',
        labelKey: 'products',
        descriptionKey: 'productsDesc',
        href: '/menu/products',
        color: 'bg-violet-500',
      },
      {
        id: 'add-product',
        labelKey: 'addProduct',
        descriptionKey: 'addProductDesc',
        href: '/menu/products',
        color: 'bg-indigo-500',
        intent: 'add',
      },
      {
        id: 'categories',
        labelKey: 'categories',
        descriptionKey: 'categoriesDesc',
        href: '/menu/categories',
        color: 'bg-pink-500',
      },
    ],
  },
  {
    groupKey: 'analytics',
    actions: [
      {
        id: 'dashboard',
        labelKey: 'dashboard',
        descriptionKey: 'dashboardDesc',
        href: '/menu/dashboard',
        color: 'bg-sky-500',
      },
      {
        id: 'reports',
        labelKey: 'reports',
        descriptionKey: 'reportsDesc',
        href: '/menu/reports',
        color: 'bg-teal-500',
      },
    ],
  },
  {
    groupKey: 'system',
    actions: [
      {
        id: 'settings',
        labelKey: 'settings',
        descriptionKey: 'settingsDesc',
        href: '/menu/settings',
        color: 'bg-slate-500',
      },
    ],
  },
];
