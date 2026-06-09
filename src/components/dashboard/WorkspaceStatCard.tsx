import Link from "next/link";
import { cn } from "@/lib/utils";

export function WorkspaceStatCard({
  label,
  value,
  hint,
  href,
  accent,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  accent?: "positive" | "negative";
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2 sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          {label}
        </p>
        <p
          className={cn(
            "pf-stat-card-value shrink-0 text-xl font-bold tabular-nums tracking-tight text-[var(--foreground)] sm:mt-1.5 sm:text-2xl",
            accent === "positive" && "text-[var(--pf-positive)]",
            accent === "negative" && "text-[var(--pf-negative)]"
          )}
        >
          {value}
        </p>
      </div>
      {hint ? (
        <p className="mt-1 truncate text-[11px] text-[var(--pf-gray-500)] sm:text-xs">{hint}</p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "pf-stat-card block transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)]",
          className
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn("pf-stat-card", className)}>{body}</div>;
}
