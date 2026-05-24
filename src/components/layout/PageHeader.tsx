import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-[var(--pf-border)] pb-6",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--pf-black)]">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--pf-gray-500)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
