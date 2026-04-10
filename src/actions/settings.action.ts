'use server';

// TODO: wire to a settings service / DB table when available

export interface GeneralSettingsInput {
  currency: string;
  language: string;
}

export interface NotificationSettingsInput {
  lowStock: boolean;
  stockOut: boolean;
  newTransaction: boolean;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function saveGeneralSettingsAction(
  input: GeneralSettingsInput
): Promise<ActionResult> {
  try {
    // Placeholder — persist to DB via settings service when ready
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function saveNotificationSettingsAction(
  input: NotificationSettingsInput
): Promise<ActionResult> {
  try {
    // Placeholder — persist to DB via settings service when ready
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}


