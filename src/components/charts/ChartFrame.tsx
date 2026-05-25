import { cn } from "@/lib/utils";

export function ChartFrame({
  title,
  subtitle,
  legend,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pf-chart-frame", className)}>
      {title || subtitle ? (
        <div className="pf-chart-frame-header">
          {title ? (
            <p className="text-xs font-semibold text-[var(--pf-black)]">{title}</p>
          ) : null}
          {subtitle ? (
            <p className="text-[10px] text-[var(--pf-gray-500)]">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      <div className="pf-chart-frame-body">{children}</div>
      {legend ? <div className="pf-chart-frame-legend">{legend}</div> : null}
    </div>
  );
}
