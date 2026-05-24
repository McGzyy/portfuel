import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = "Learn more",
  className,
  centered,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        centered && "flex-col items-center text-center",
        className
      )}
    >
      <div className={centered ? "max-w-2xl" : undefined}>
        {eyebrow ? <p className="pf-eyebrow">{eyebrow}</p> : null}
        <h2
          className={cn(
            "font-bold tracking-tight text-[var(--pf-black)]",
            eyebrow ? "mt-2 text-2xl sm:text-3xl" : "text-2xl sm:text-3xl"
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-base leading-relaxed text-[var(--pf-gray-500)]">{subtitle}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="text-sm font-semibold text-[var(--pf-red)] hover:text-[var(--pf-red-hover)]"
        >
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}
