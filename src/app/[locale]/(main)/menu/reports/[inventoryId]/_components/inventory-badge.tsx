import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { Warehouse } from 'lucide-react';

interface Props {
  inventoryId: string;
}

export async function InventoryBadge({ inventoryId }: Props) {
  const t = await getTranslations('reports');

  if (inventoryId === 'all') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-4 pb-1">
        <Warehouse className="h-3 w-3" />
        {t('allInventories')}
      </span>
    );
  }

  const inv = await prisma.inventory.findUnique({
    where: { id: Number(inventoryId) },
    select: { name: true },
  });

  if (!inv) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-4 pb-1">
      <Warehouse className="h-3 w-3" />
      {inv.name}
    </span>
  );
}
