import Link from "next/link";
import { cn } from "@/lib/utils";

export type MetricItem = {
  label: string;
  value: string;
  hint?: string;
  accent?: "positive" | "negative" | "neutral";
  href?: string;
};

export function MetricsStrip({
  eyebrow = "Pulse",
  items,
  variant = "light",
  showEyebrow = true,
  className,
}: {
  eyebrow?: string;
  items: MetricItem[];
  variant?: "light" | "dark" | "embedded";
  showEyebrow?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;

  const dark = variant === "dark";
  const embedded = variant === "embedded";

  return (
    <section
      className={cn(
        !embedded && "pf-metrics-strip",
        dark && "pf-metrics-strip-dark",
        embedded && "pf-metrics-strip--embedded px-4 py-4",
        className
      )}
      aria-label={eyebrow}
    >
      {embedded || !showEyebrow ? null : (
        <p
          className={cn(
            "pf-metrics-strip-eyebrow",
            dark ? "text-red-300/80" : undefined
          )}
        >
          {eyebrow}
        </p>
      )}
      <div className={cn("pf-metrics-strip-grid", !showEyebrow && "mt-0")}>
        {items.map((item) => {
          const cell = (
            <>
              <p className="pf-metrics-strip-label">{item.label}</p>
              <p
                className={cn(
                  "pf-metrics-strip-value",
                  item.accent === "positive" && "is-positive",
                  item.accent === "negative" && "is-negative"
                )}
              >
                {item.value}
              </p>
              {item.hint ? (
                <p className="pf-metrics-strip-hint">{item.hint}</p>
              ) : null}
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="pf-metrics-strip-cell rounded-md transition-colors hover:bg-[var(--pf-gray-50)]"
              >
                {cell}
              </Link>
            );
          }

          return (
            <div key={item.label} className="pf-metrics-strip-cell">
              {cell}
            </div>
          );
        })}
      </div>
    </section>
  );
}
