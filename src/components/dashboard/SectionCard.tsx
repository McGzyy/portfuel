import Link from "next/link";

export function SectionCard({
  title,
  description,
  href,
  linkLabel,
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pf-elite-panel overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--pf-border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">{description}</p>
          ) : null}
        </div>
        {href && linkLabel ? (
          <Link
            href={href}
            className="shrink-0 text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
