import { cn } from "@/lib/utils";

type StepId = "scan" | "inbox" | "ready" | "published";

const STEPS: { id: StepId; label: string }[] = [
  { id: "scan", label: "Scan" },
  { id: "inbox", label: "Inbox" },
  { id: "ready", label: "Ready" },
  { id: "published", label: "Published" },
];

export function DiscoveryWorkflowStepper({
  activeStep,
  counts,
}: {
  activeStep: StepId;
  counts: { inbox: number; ready: number };
}) {
  const activeIdx = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <nav aria-label="Discovery workflow" className="flex flex-wrap items-center gap-1 sm:gap-0">
      {STEPS.map((step, i) => {
        const done = i < activeIdx;
        const active = step.id === activeStep;
        const count =
          step.id === "inbox" ? counts.inbox : step.id === "ready" ? counts.ready : null;

        return (
          <div key={step.id} className="flex items-center">
            {i > 0 ? (
              <span
                className={cn(
                  "mx-1 hidden h-px w-6 sm:block sm:w-10",
                  done ? "bg-[var(--pf-red)]/40" : "bg-[var(--pf-border)]"
                )}
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                active
                  ? "bg-[var(--pf-red-muted)] text-[var(--pf-red)]"
                  : done
                    ? "text-[var(--pf-gray-600)]"
                    : "text-[var(--pf-gray-400)]"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  active
                    ? "bg-[var(--pf-red)] text-white"
                    : done
                      ? "bg-[var(--pf-gray-200)] text-[var(--pf-gray-700)]"
                      : "border border-[var(--pf-border)] bg-white text-[var(--pf-gray-400)]"
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span>{step.label}</span>
              {count != null && count > 0 ? (
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[var(--pf-red)]">
                  {count}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export type { StepId };
