import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseProps {
  label: string;
  description?: string;
}

interface ToggleProps extends BaseProps {
  type: 'toggle';
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

interface ActionProps extends BaseProps {
  type: 'action';
  onClick?: () => void;
  value?: string;
}

type Props = ToggleProps | ActionProps;

export function SettingsRow(props: Props) {
  const { label, description } = props;

  const isActionButton = props.type === 'action' && props.onClick;

  const content = (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 w-full text-left">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {props.type === 'toggle' ? (
        <button
          role="switch"
          aria-checked={props.checked}
          aria-label={label}
          onClick={(e) => {
            e.stopPropagation();
            props.onCheckedChange(!props.checked);
          }}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            props.checked ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
              props.checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          {props.value && <span className="text-sm">{props.value}</span>}
          {props.onClick && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
        </div>
      )}
    </div>
  );

  if (isActionButton) {
    return (
      <button
        onClick={props.onClick}
        className="flex w-full active:bg-muted transition-colors"
      >
        {content}
      </button>
    );
  }

  return <div className="flex">{content}</div>;
}
