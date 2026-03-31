import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireNonEmpty, requirePositive, requireNonNegative } from './validation';
import type {
  ProductSummary,
  ProductStatus,
  CreateProductInput,
  UpdateProductInput,
} from './types';

export const PRODUCT_TAG = 'products';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tinh trang thai ton kho dua tren so luong hien tai va nguong tai dat hang.
 * - out_of_stock: stockQty = 0
 * - low_stock:    0 < stockQty <= reorderLevel
 * - active:       stockQty > reorderLevel
 */
function deriveProductStatus(stockQty: number, reorderLevel: number): ProductStatus {
  if (stockQty === 0) return 'out_of_stock';
  if (stockQty <= reorderLevel) return 'low_stock';
  return 'active';
}

/**
 * Tinh ton kho hien tai cua mot san pham bang cach cong don tat ca giao dich.
 * stock_in va adjustment co quantity duong, stock_out co quantity am.
 */
async function computeStockQty(productId: number): Promise<number> {
  const result = await prisma.stockTransaction.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

/**
 * Map Prisma product row sang ProductSummary, nhan stockQty tu ngoai vao
 * de tranh N+1 query khi goi trong vong lap.
 */
function mapToProductSummary(
  product: {
    id: number;
    name: string;
    shortDescription: string | null;
    brand: string | null;
    imageUrl: string | null;
    costPrice: number;
    price: number;
    reorderLevel: number;
    category: { id: number; name: string };
    provider: { id: number; name: string };
    inventory: { id: number; name: string };
    createdAt: Date;
    updatedAt: Date;
  },
  stockQty: number
): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    shortDescription: product.shortDescription,
    brand: product.brand,
    imageUrl: product.imageUrl,
    costPrice: product.costPrice,
    price: product.price,
    reorderLevel: product.reorderLevel,
    stockQty,
    status: deriveProductStatus(stockQty, product.reorderLevel),
    categoryId: product.category.id,
    categoryName: product.category.name,
    providerId: product.provider.id,
    providerName: product.provider.name,
    inventoryId: product.inventory.id,
    inventoryName: product.inventory.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Prisma include fragment dung chung
// ---------------------------------------------------------------------------

const productInclude = {
  category: { select: { id: true, name: true } },
  provider: { select: { id: true, name: true } },
  inventory: { select: { id: true, name: true } },
} as const;

// ---------------------------------------------------------------------------
// Queries (memoized per-request voi React cache)
// ---------------------------------------------------------------------------

/**
 * Lay danh sach tat ca san pham kem thong tin ton kho tinh toan.
 * Dung mot query aggregate de lay stockQty cua tat ca san pham,
 * tranh N+1 query.
 */
export const getAllProducts = unstable_cache(
  async (): Promise<ProductSummary[]> => {
    const [products, stockAggregates] = await Promise.all([
      prisma.product.findMany({
        include: productInclude,
        orderBy: { name: 'asc' },
      }),
      prisma.stockTransaction.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
      }),
    ]);

    const stockMap = new Map<number, number>(
      stockAggregates.map((row) => [row.productId, row._sum.quantity ?? 0])
    );

    return products.map((p) => mapToProductSummary(p, stockMap.get(p.id) ?? 0));
  },
  ['products'],
  { tags: [PRODUCT_TAG] }
);

/**
 * Lay thong tin chi tiet mot san pham theo id.
 */
export const getProductById = cache(async (id: number): Promise<ProductSummary | null> => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!product) return null;

  const stockQty = await computeStockQty(id);
  return mapToProductSummary(product, stockQty);
});

/**
 * Lay danh sach san pham theo inventory.
 */
export const getProductsByInventory = cache(
  async (inventoryId: number): Promise<ProductSummary[]> => {
    const [products, stockAggregates] = await Promise.all([
      prisma.product.findMany({
        where: { inventoryId },
        include: productInclude,
        orderBy: { name: 'asc' },
      }),
      prisma.stockTransaction.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: { product: { inventoryId } },
      }),
    ]);

    const stockMap = new Map<number, number>(
      stockAggregates.map((row) => [row.productId, row._sum.quantity ?? 0])
    );

    return products.map((p) => mapToProductSummary(p, stockMap.get(p.id) ?? 0));
  }
);

/**
 * Lay danh sach san pham co ton kho thap (low_stock hoac out_of_stock).
 */
export const getLowStockProducts = cache(async (): Promise<ProductSummary[]> => {
  const all = await getAllProducts();
  return all.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock');
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Tao moi mot san pham. Khong tao giao dich ton kho o day;
 * viec nhap hang dau tien phai thuc hien qua transactionService.createTransaction.
 */
export async function createProduct(input: CreateProductInput): Promise<ProductSummary> {
  requireNonEmpty(input.name, 'Product name');
  requirePositive(input.costPrice, 'Cost price');
  requirePositive(input.price, 'Retail price');
  requireNonNegative(input.reorderLevel ?? 0, 'Reorder level');
  if (input.price < input.costPrice)
    throw new Error('ERR_PRICE_BELOW_COST');

  const product = await prisma.product.create({
    data: {
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      imageUrl: input.imageUrl,
      brand: input.brand,
      costPrice: input.costPrice,
      price: input.price,
      reorderLevel: input.reorderLevel ?? 0,
      categoryId: input.categoryId,
      providerId: input.providerId,
      inventoryId: input.inventoryId,
    },
    include: productInclude,
  });

  // San pham moi tao chua co giao dich nao, stockQty = 0
  return mapToProductSummary(product, 0);
}

/**
 * Cap nhat thong tin san pham (khong bao gom ton kho).
 */
export async function updateProduct(
  id: number,
  input: UpdateProductInput
): Promise<ProductSummary> {
  if (input.name !== undefined) requireNonEmpty(input.name, 'Product name');
  if (input.costPrice !== undefined) requirePositive(input.costPrice, 'Cost price');
  if (input.price !== undefined) requirePositive(input.price, 'Retail price');
  if (input.reorderLevel !== undefined) requireNonNegative(input.reorderLevel, 'Reorder level');
  if (input.price !== undefined && input.costPrice !== undefined && input.price < input.costPrice)
    throw new Error('ERR_PRICE_BELOW_COST');

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.brand !== undefined && { brand: input.brand }),
      ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.reorderLevel !== undefined && { reorderLevel: input.reorderLevel }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.providerId !== undefined && { providerId: input.providerId }),
      ...(input.inventoryId !== undefined && { inventoryId: input.inventoryId }),
    },
    include: productInclude,
  });

  const stockQty = await computeStockQty(id);
  return mapToProductSummary(product, stockQty);
}

/**
 * Xoa san pham. Chi cho phep xoa khi khong con giao dich nao lien quan.
 */
export async function deleteProduct(id: number): Promise<void> {
  const transactionCount = await prisma.stockTransaction.count({ where: { productId: id } });
  if (transactionCount > 0) {
    throw new Error('ERR_HAS_TRANSACTIONS');
  }
  await prisma.product.delete({ where: { id } });
}
