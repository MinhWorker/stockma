import 'server-only';
import { prisma } from '@/lib/db';
import type { ActivityAction, ActivityLogRecord } from './types';

export const ACTIVITY_CACHE_TAG = 'activity';

export interface CreateActivityLogInput {
  action: ActivityAction;
  entityType: string;
  entityId?: number;
  entityName?: string;
  description: string;
  inventoryId?: number;
  userId: string;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function logActivity(input: CreateActivityLogInput): Promise<void> {
  await prisma.activityLog.create({ data: input });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getActivityLogs(options?: {
  entityType?: string;
  action?: ActivityAction;
  inventoryId?: number;
  limit?: number;
}): Promise<ActivityLogRecord[]> {
  const rows = await prisma.activityLog.findMany({
    where: {
      ...(options?.entityType && { entityType: options.entityType }),
      ...(options?.action && { action: options.action }),
      ...(options?.inventoryId && { inventoryId: options.inventoryId }),
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
  });

  return rows.map((r) => ({
    id: r.id,
    action: r.action as ActivityAction,
    entityType: r.entityType,
    entityId: r.entityId,
    entityName: r.entityName,
    description: r.description,
    inventoryId: r.inventoryId,
    userId: r.userId,
    userName: r.user.name,
    createdAt: r.createdAt,
  }));
}
