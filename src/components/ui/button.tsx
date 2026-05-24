import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--pf-radius)] text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-red)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--pf-red)] text-white shadow-[var(--pf-shadow-sm)] hover:bg-[var(--pf-red-hover)]",
        secondary:
          "border border-[var(--pf-border)] bg-white text-[var(--pf-black)] shadow-[var(--pf-shadow-sm)] hover:bg-[var(--pf-gray-50)]",
        ghost: "text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-100)]",
        outline:
          "border border-[var(--pf-red)] text-[var(--pf-red)] hover:bg-[var(--pf-red)] hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
