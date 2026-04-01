import 'server-only';
import { prisma } from '@/lib/db';
import { requireNonEmpty, requirePositive } from './validation';
import { fetchVariantStockQuantity } from './stock.helpers';
import type { VariantSummary, CreateVariantInput, UpdateVariantInput } from './types';

export interface EffectivePrices {
  effectiveCostPrice: number;
  effectivePrice: number;
  effectiveUnit: string | null;
}

export function resolveEffectivePrices(
  product: { costPrice: number; price: number; unit?: string | null },
  variant?: { costPrice?: number | null; price?: number | null; unit?: string | null } | null
): EffectivePrices {
  return {
    effectiveCostPrice: variant?.costPrice ?? product.costPrice,
    effectivePrice: variant?.price ?? product.price,
    effectiveUnit: variant?.unit ?? product.unit ?? null,
  };
}

function mapToVariantSummary(
  variant: {
    id: number;
    productId: number;
    name: string;
    costPrice: number | null;
    price: number | null;
    unit: string | null;
    createdAt: Date;
    updatedAt: Date;
    product: { costPrice: number; price: number; unit: string | null };
  },
  stockQuantity: number
): VariantSummary {
  const { effectiveCostPrice, effectivePrice, effectiveUnit } = resolveEffectivePrices(
    variant.product,
    variant
  );
  return {
    id: variant.id,
    productId: variant.productId,
    name: variant.name,
    costPrice: variant.costPrice,
    price: variant.price,
    unit: variant.unit,
    effectiveCostPrice,
    effectivePrice,
    effectiveUnit,
    stockQty: stockQuantity,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  };
}

const variantInclude = {
  product: { select: { costPrice: true, price: true, unit: true } },
} as const;

export async function getVariantsByProduct(productId: number): Promise<VariantSummary[]> {
  const [variants, stockAggregates] = await Promise.all([
    prisma.productVariant.findMany({
      where: { productId },
      include: variantInclude,
      orderBy: { name: 'asc' },
    }),
    prisma.stockTransaction.groupBy({
      by: ['variantId'],
      where: { variantId: { not: null }, product: { id: productId } },
      _sum: { quantity: true },
    }),
  ]);

  const stockMap = new Map<number, number>(
    stockAggregates
      .filter((r) => r.variantId !== null)
      .map((r) => [r.variantId as number, r._sum.quantity ?? 0])
  );

  return variants.map((v) => mapToVariantSummary(v, stockMap.get(v.id) ?? 0));
}

export async function getVariantById(variantId: number): Promise<VariantSummary | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: variantInclude,
  });
  if (!variant) return null;
  const stockQuantity = await fetchVariantStockQuantity(variantId);
  return mapToVariantSummary(variant, stockQuantity);
}

export async function createVariant(input: CreateVariantInput): Promise<VariantSummary> {
  requireNonEmpty(input.name, 'Variant name');
  if (input.costPrice !== undefined) requirePositive(input.costPrice, 'Variant cost price');
  if (input.price !== undefined) requirePositive(input.price, 'Variant price');

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: input.productId },
    select: { costPrice: true, price: true, unit: true },
  });

  const { effectiveCostPrice, effectivePrice } = resolveEffectivePrices(product, {
    costPrice: input.costPrice ?? null,
    price: input.price ?? null,
  });
  if (effectivePrice < effectiveCostPrice) throw new Error('ERR_PRICE_BELOW_COST');

  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId: input.productId,
        name: input.name,
        costPrice: input.costPrice,
        price: input.price,
        unit: input.unit,
      },
      include: variantInclude,
    });
    return mapToVariantSummary(variant, 0);
  } catch (err) {
    if (err instanceof Error && (err as { code?: string }).code === 'P2002') {
      throw new Error('ERR_VARIANT_DUPLICATE_NAME');
    }
    throw err;
  }
}

export async function updateVariant(id: number, input: UpdateVariantInput): Promise<VariantSummary> {
  if (input.name !== undefined) requireNonEmpty(input.name, 'Variant name');
  if (input.costPrice !== undefined) requirePositive(input.costPrice, 'Variant cost price');
  if (input.price !== undefined) requirePositive(input.price, 'Variant price');

  const existing = await prisma.productVariant.findUniqueOrThrow({
    where: { id },
    include: variantInclude,
  });

  const merged = {
    costPrice: input.costPrice !== undefined ? input.costPrice : existing.costPrice,
    price: input.price !== undefined ? input.price : existing.price,
    unit: input.unit !== undefined ? input.unit : existing.unit,
  };

  const { effectiveCostPrice, effectivePrice } = resolveEffectivePrices(existing.product, merged);
  if (effectivePrice < effectiveCostPrice) throw new Error('ERR_PRICE_BELOW_COST');

  try {
    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.unit !== undefined && { unit: input.unit }),
      },
      include: variantInclude,
    });
    const stockQuantity = await fetchVariantStockQuantity(id);
    return mapToVariantSummary(updated, stockQuantity);
  } catch (err) {
    if (err instanceof Error && (err as { code?: string }).code === 'P2002') {
      throw new Error('ERR_VARIANT_DUPLICATE_NAME');
    }
    throw err;
  }
}

export async function deleteVariant(id: number): Promise<void> {
  const transactionCount = await prisma.stockTransaction.count({ where: { variantId: id } });
  if (transactionCount > 0) throw new Error('ERR_VARIANT_HAS_TRANSACTIONS');
  await prisma.productVariant.delete({ where: { id } });
}