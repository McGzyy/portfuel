import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm text-[var(--pf-black)] placeholder:text-[var(--pf-gray-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-red)] focus-visible:ring-offset-1",
        className
      )}
      {...props}
    />
  );
}
