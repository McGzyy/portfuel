import type { ReactNode } from "react";

export function AdminPanelHeader({
  group,
  title,
  description,
  actions,
  footer,
}: {
  group: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="pf-workspace-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            {group}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--pf-black)]">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-[var(--pf-gray-500)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}
