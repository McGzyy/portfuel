import { cn } from "@/lib/utils";

export type MetricItem = {
  label: string;
  value: string;
  hint?: string;
  accent?: "positive" | "negative" | "neutral";
};

export function MetricsStrip({
  eyebrow = "Pulse",
  items,
  variant = "light",
  className,
}: {
  eyebrow?: string;
  items: MetricItem[];
  variant?: "light" | "dark";
  className?: string;
}) {
  if (items.length === 0) return null;

  const dark = variant === "dark";

  return (
    <section
      className={cn(
        "pf-metrics-strip",
        dark && "pf-metrics-strip-dark",
        className
      )}
      aria-label={eyebrow}
    >
      <p
        className={cn(
          "pf-metrics-strip-eyebrow",
          dark ? "text-red-300/80" : undefined
        )}
      >
        {eyebrow}
      </p>
      <div className="pf-metrics-strip-grid">
        {items.map((item) => (
          <div key={item.label} className="pf-metrics-strip-cell">
            <p className="pf-metrics-strip-label">{item.label}</p>
            <p
              className={cn(
                "pf-metrics-strip-value",
                item.accent === "positive" && "text-emerald-500",
                item.accent === "negative" && "text-rose-500",
                dark && item.accent == null && "text-white"
              )}
            >
              {item.value}
            </p>
            {item.hint ? (
              <p className="pf-metrics-strip-hint">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
