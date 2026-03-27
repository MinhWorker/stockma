interface ActionBarProps {
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function ActionBar({ children, action }: ActionBarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-2">{children}</div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
