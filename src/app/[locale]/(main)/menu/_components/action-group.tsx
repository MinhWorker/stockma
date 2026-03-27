import { ActionCard } from './action-card';
import type { ActionGroup as ActionGroupType } from '../_config/quick-actions';

interface ActionGroupProps {
  group: ActionGroupType;
  groupLabel: string;
  actionLabels: Record<string, { label: string; description: string }>;
}

export function ActionGroup({ group, groupLabel, actionLabels }: ActionGroupProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {groupLabel}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {group.actions.map((action) => {
          const labels = actionLabels[action.id] ?? {
            label: action.labelKey,
            description: '',
          };
          return (
            <ActionCard
              key={action.id}
              action={action}
              label={labels.label}
              description={labels.description}
            />
          );
        })}
      </div>
    </section>
  );
}
