import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3.5 py-2 text-base text-[var(--pf-black)] shadow-[var(--pf-shadow-sm)] placeholder:text-[var(--pf-gray-400)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-red)] focus-visible:ring-offset-1 sm:text-sm",
        className
      )}
      {...props}
    />
  );
}
