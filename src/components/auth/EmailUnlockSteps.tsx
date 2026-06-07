import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "membership", label: "Membership" },
  { id: "email", label: "Confirm email" },
  { id: "2fa", label: "2FA" },
  { id: "workspace", label: "Workspace" },
] as const;

export type EmailUnlockStep = (typeof STEPS)[number]["id"];

export function EmailUnlockSteps({
  current,
  className,
}: {
  current: EmailUnlockStep;
  className?: string;
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol
      className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[10px]", className)}
      aria-label="Account setup progress"
    >
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-2">
            {index > 0 ? (
              <span
                className={cn(
                  "hidden h-px w-4 sm:block",
                  done ? "bg-emerald-400" : "bg-[var(--pf-border)]"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold uppercase tracking-wide",
                done && "border-emerald-200 bg-emerald-50 text-emerald-800",
                active && "border-[var(--pf-red)]/40 bg-[var(--pf-red-muted)] text-[var(--pf-red)]",
                !done && !active && "border-[var(--pf-border)] bg-white text-[var(--pf-gray-400)]"
              )}
            >
              {done ? (
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              ) : active ? (
                <Lock className="h-3 w-3" strokeWidth={2.25} aria-hidden />
              ) : (
                <span className="h-3 w-3 rounded-full border border-current opacity-40" aria-hidden />
              )}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
