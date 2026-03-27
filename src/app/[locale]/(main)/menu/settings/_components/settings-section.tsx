interface Props {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: Props) {
  return (
    <section className="space-y-1">
      <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="divide-y divide-border/60 border-y border-border bg-card">{children}</div>
    </section>
  );
}
