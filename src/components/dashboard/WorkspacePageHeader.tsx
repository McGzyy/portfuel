import { cn } from "@/lib/utils";

export function WorkspacePageHeader({
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
    <header
      className={cn("mb-8 flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
