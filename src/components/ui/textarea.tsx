import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full resize-y rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--pf-black)] shadow-[var(--pf-shadow-sm)] placeholder:text-[var(--pf-gray-400)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-red)] focus-visible:ring-offset-1",
        className
      )}
      {...props}
    />
  );
});
