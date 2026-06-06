import Link from "next/link";
import { Megaphone } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

export function WorkspacePageHeader({
  eyebrow = "Member workspace",
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-[var(--pf-border)]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]",
              eyebrow ? "mt-1.5" : undefined
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pt-1">{action}</div> : null}
      </div>
    </header>
  );
}

/** Primary CTA used on feed / desk headers */
export function WorkspaceHeaderAction({
  href,
  label = COPY.newCall,
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--pf-radius)] bg-[var(--pf-red)] px-4 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
    >
      <Megaphone className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      {label}
    </Link>
  );
}

/** Primary CTA for feed, desk, and overview — publish a community call */
export function WorkspaceNewCallAction() {
  return <WorkspaceHeaderAction href={COPY.newCallHref} label={COPY.publishCallCta} />;
}
