import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 block text-sm font-medium text-[var(--pf-gray-700)]", className)}
      {...props}
    >
      {children}
    </label>
  );
}
