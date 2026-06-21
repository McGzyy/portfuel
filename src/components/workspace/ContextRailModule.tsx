export function ContextRailModule({
  eyebrow,
  title,
  ariaLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="pf-workspace-context-rail" aria-label={ariaLabel}>
      <div className="pf-context-rail-module">
        <div className="pf-context-rail-module-head">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-gray-400)]">
            {eyebrow}
          </p>
          <p className="mt-0.5 text-sm font-bold text-[var(--pf-black)]">{title}</p>
        </div>
        <div className="pf-context-rail-module-body">{children}</div>
      </div>
    </aside>
  );
}

export function ContextRailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--pf-border)] px-4 py-3 last:border-b-0">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        {title}
      </p>
      {children}
    </div>
  );
}
