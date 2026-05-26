export function OverviewSection({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
