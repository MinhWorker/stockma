'use server';

import { getActivityLogs } from '@/services/activity.service';
import type { ActivityAction } from '@/services/types';

export async function getActivityLogsAction(options?: {
  entityType?: string;
  action?: ActivityAction;
  inventoryId?: number;
  limit?: number;
}) {
  return getActivityLogs(options);
}
