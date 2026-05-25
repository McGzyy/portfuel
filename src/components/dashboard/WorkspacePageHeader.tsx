import Link from "next/link";
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
    <header
      className={cn(
        "mb-8 border-b border-[var(--pf-border)] pb-8",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-red)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--pf-gray-500)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

/** Primary CTA used on feed / desk headers */
export function WorkspaceHeaderAction({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-[var(--pf-radius)] bg-[var(--pf-red)] px-4 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
    >
      {label}
    </Link>
  );
}
