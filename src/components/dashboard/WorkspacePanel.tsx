import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkspacePanel({
  title,
  subtitle,
  href,
  children,
  className,
  headerClassName,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <section className={cn("pf-workspace-panel flex flex-col", className)}>
      <div
        className={cn(
          "flex items-start justify-between gap-3 border-b border-[var(--pf-border)] px-5 py-4",
          headerClassName
        )}
      >
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}
