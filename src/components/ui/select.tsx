import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full cursor-pointer appearance-none rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white px-3.5 py-2 text-sm text-[var(--pf-black)] shadow-[var(--pf-shadow-sm)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-red)] focus-visible:ring-offset-1",
        className
      )}
      {...props}
    />
  );
}
