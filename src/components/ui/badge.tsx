import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "long" | "short" | "fueled" | "trusted" | "discovery";
  className?: string;
}) {
  const styles = {
    default: "bg-[var(--pf-gray-100)] text-[var(--pf-gray-700)]",
    long: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    short: "bg-rose-50 text-rose-700 border border-rose-200",
    fueled: "bg-[var(--pf-red)] text-white",
    trusted: "bg-[var(--pf-black)] text-white",
    discovery: "border border-sky-200 bg-sky-50 text-sky-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
