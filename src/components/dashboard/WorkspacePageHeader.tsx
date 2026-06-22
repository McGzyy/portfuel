import Link from "next/link";
import { Megaphone } from "lucide-react";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

/** Unified workspace page title — card on mobile, flat row on desktop (lg+). */
export function WorkspacePageHeader({
  eyebrow,
  eyebrowMobileOnly = false,
  title,
  titleAddon,
  description,
  action,
  footerLink,
  className,
}: {
  eyebrow?: string;
  /** Hide eyebrow on desktop — useful when sidebar already signals location. */
  eyebrowMobileOnly?: boolean;
  title: React.ReactNode;
  titleAddon?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footerLink?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pf-workspace-page-header", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? (
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]",
                eyebrowMobileOnly && "lg:hidden"
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {typeof title === "string" ? (
              <h1
                className={cn(
                  "text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]",
                  eyebrow ? "mt-1.5 lg:mt-0" : undefined
                )}
              >
                {title}
              </h1>
            ) : (
              title
            )}
            {titleAddon}
          </div>
          {description ? (
            <div className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{description}</div>
          ) : null}
          {footerLink ? <div className="mt-3">{footerLink}</div> : null}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
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
