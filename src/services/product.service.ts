import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireNonEmpty, requirePositive } from './validation';
import { resolveEffectivePrices } from './variant.service';
import { fetchProductStockQuantity } from './stock.helpers';
import type {
  ProductSummary,
  ProductStatus,
  VariantSummary,
  CreateProductInput,
  UpdateProductInput,
} from './types';

export const PRODUCT_CACHE_TAG = 'products';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveProductStatus(stockQuantity: number): ProductStatus {
  return stockQuantity === 0 ? 'out_of_stock' : 'active';
}

function buildVariantStockMap(
  aggregates: Array<{ variantId: number | null; _sum: { quantity: number | null } }>
): Map<number, number> {
  return new Map(
    aggregates
      .filter((r) => r.variantId !== null)
      .map((r) => [r.variantId as number, r._sum.quantity ?? 0])
  );
}

function mapToProductSummary(
  product: {
    id: number;
    name: string;
    shortDescription: string | null;
    brand: string | null;
    imageUrl: string | null;
    costPrice: number;
    price: number;
    unit: string | null;
    category: { id: number; name: string };
    provider: { id: number; name: string };
    inventory: { id: number; name: string };
    variants: { id: number; productId: number; name: string; costPrice: number | null; price: number | null; unit: string | null; createdAt: Date; updatedAt: Date }[];
    createdAt: Date;
    updatedAt: Date;
  },
  stockQuantity: number,
  variantStockMap: Map<number, number>
): ProductSummary {
  const variants: VariantSummary[] = product.variants.map((v) => {
    const { effectiveCostPrice, effectivePrice, effectiveUnit } = resolveEffectivePrices(product, v);
    return {
      id: v.id,
      productId: v.productId,
      name: v.name,
      costPrice: v.costPrice,
      price: v.price,
      unit: v.unit,
      effectiveCostPrice,
      effectivePrice,
      effectiveUnit,
      stockQty: variantStockMap.get(v.id) ?? 0,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  });

  return {
    id: product.id,
    name: product.name,
    shortDescription: product.shortDescription,
    brand: product.brand,
    imageUrl: product.imageUrl,
    costPrice: product.costPrice,
    price: product.price,
    unit: product.unit,
    stockQty: stockQuantity,
    status: deriveProductStatus(stockQuantity),
    categoryId: product.category.id,
    categoryName: product.category.name,
    providerId: product.provider.id,
    providerName: product.provider.name,
    inventoryId: product.inventory.id,
    inventoryName: product.inventory.name,
    variants,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  provider: { select: { id: true, name: true } },
  inventory: { select: { id: true, name: true } },
  variants: {
    select: { id: true, productId: true, name: true, costPrice: true, price: true, unit: true, createdAt: true, updatedAt: true },
    orderBy: { name: 'asc' as const },
  },
} as const;

async function fetchVariantStockMapForProduct(productId: number): Promise<Map<number, number>> {
  const aggregates = await prisma.stockTransaction.groupBy({
    by: ['variantId'],
    where: { variantId: { not: null }, product: { id: productId } },
    _sum: { quantity: true },
  });
  return buildVariantStockMap(aggregates);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAllProducts = unstable_cache(
  async (): Promise<ProductSummary[]> => {
    const [products, stockAggregates, variantStockAggregates] = await Promise.all([
      prisma.product.findMany({ include: PRODUCT_INCLUDE, orderBy: { name: 'asc' } }),
      prisma.stockTransaction.groupBy({ by: ['productId'], _sum: { quantity: true } }),
      prisma.stockTransaction.groupBy({
        by: ['variantId'],
        where: { variantId: { not: null } },
        _sum: { quantity: true },
      }),
    ]);

    const stockMap = new Map<number, number>(
      stockAggregates.map((row) => [row.productId, row._sum.quantity ?? 0])
    );
    const variantStockMap = buildVariantStockMap(variantStockAggregates);

    return products.map((p) => mapToProductSummary(p, stockMap.get(p.id) ?? 0, variantStockMap));
  },
  ['products'],
  { tags: [PRODUCT_CACHE_TAG] }
);

export const getProductById = cache(async (id: number): Promise<ProductSummary | null> => {
  const product = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  if (!product) return null;

  const [stockQuantity, variantStockMap] = await Promise.all([
    fetchProductStockQuantity(id),
    fetchVariantStockMapForProduct(id),
  ]);
  return mapToProductSummary(product, stockQuantity, variantStockMap);
});

export const getProductsByInventory = cache(async (inventoryId: number): Promise<ProductSummary[]> => {
  const [products, stockAggregates, variantStockAggregates] = await Promise.all([
    prisma.product.findMany({
      where: { inventoryId },
      include: PRODUCT_INCLUDE,
      orderBy: { name: 'asc' },
    }),
    prisma.stockTransaction.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { product: { inventoryId } },
    }),
    prisma.stockTransaction.groupBy({
      by: ['variantId'],
      where: { variantId: { not: null }, product: { inventoryId } },
      _sum: { quantity: true },
    }),
  ]);

  const stockMap = new Map<number, number>(
    stockAggregates.map((row) => [row.productId, row._sum.quantity ?? 0])
  );
  const variantStockMap = buildVariantStockMap(variantStockAggregates);

  return products.map((p) => mapToProductSummary(p, stockMap.get(p.id) ?? 0, variantStockMap));
});

export const getLowStockProducts = cache(async (): Promise<ProductSummary[]> => {
  const all = await getAllProducts();
  return all.filter((p) => p.status === 'out_of_stock');
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createProduct(input: CreateProductInput): Promise<ProductSummary> {
  requireNonEmpty(input.name, 'Product name');
  requirePositive(input.costPrice, 'Cost price');
  requirePositive(input.price, 'Retail price');
  if (input.price < input.costPrice) throw new Error('ERR_PRICE_BELOW_COST');

  const product = await prisma.product.create({
    data: {
      name: input.name,
      shortDescription: input.shortDescription,
      description: input.description,
      imageUrl: input.imageUrl,
      brand: input.brand,
      costPrice: input.costPrice,
      price: input.price,
      unit: input.unit,
      categoryId: input.categoryId,
      providerId: input.providerId,
      inventoryId: input.inventoryId,
    },
    include: PRODUCT_INCLUDE,
  });

  return mapToProductSummary(product, 0, new Map());
}

export async function updateProduct(id: number, input: UpdateProductInput): Promise<ProductSummary> {
  if (input.name !== undefined) requireNonEmpty(input.name, 'Product name');
  if (input.costPrice !== undefined) requirePositive(input.costPrice, 'Cost price');
  if (input.price !== undefined) requirePositive(input.price, 'Retail price');
  if (input.price !== undefined && input.costPrice !== undefined && input.price < input.costPrice) {
    throw new Error('ERR_PRICE_BELOW_COST');
  }

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
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.providerId !== undefined && { providerId: input.providerId }),
      ...(input.inventoryId !== undefined && { inventoryId: input.inventoryId }),
      ...(input.unit !== undefined && { unit: input.unit }),
    },
    include: PRODUCT_INCLUDE,
  });

  const [stockQuantity, variantStockMap] = await Promise.all([
    fetchProductStockQuantity(id),
    fetchVariantStockMapForProduct(id),
  ]);
  return mapToProductSummary(product, stockQuantity, variantStockMap);
}

export async function deleteProduct(id: number): Promise<void> {
  const transactionCount = await prisma.stockTransaction.count({ where: { productId: id } });
  if (transactionCount > 0) throw new Error('ERR_HAS_TRANSACTIONS');
  await prisma.product.delete({ where: { id } });
}
