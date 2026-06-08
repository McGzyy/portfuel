"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CHECKLIST_DESK_VISITED_KEY,
  CHECKLIST_DISMISSED_KEY,
  WORKSPACE_CHECKLIST_STEPS,
  computeWorkspaceChecklistProgress,
} from "@/lib/onboarding/workspace-checklist";
import { cn } from "@/lib/utils";

export function WorkspaceOnboardingChecklist({
  publishedCall,
  watchlistCount,
  journalThesisCount,
  followingCount,
}: {
  publishedCall: boolean;
  watchlistCount: number;
  journalThesisCount: number;
  followingCount: number;
}) {
  const [deskVisited, setDeskVisited] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const readStorage = useCallback(() => {
    try {
      setDeskVisited(localStorage.getItem(CHECKLIST_DESK_VISITED_KEY) === "1");
      setDismissed(localStorage.getItem(CHECKLIST_DISMISSED_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    readStorage();
    const onStorage = () => readStorage();
    const onUpdate = () => readStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", readStorage);
    window.addEventListener("pf-checklist-update", onUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", readStorage);
      window.removeEventListener("pf-checklist-update", onUpdate);
    };
  }, [readStorage]);

  const progress = useMemo(
    () =>
      computeWorkspaceChecklistProgress({
        publishedCall,
        watchlistCount,
        journalThesisCount,
        followingCount,
        deskVisited,
      }),
    [publishedCall, watchlistCount, journalThesisCount, followingCount, deskVisited]
  );

  const doneMap = useMemo(() => {
    const m = new Map(progress.steps.map((s) => [s.id, s.done]));
    return m;
  }, [progress.steps]);

  if (!hydrated) return null;
  if (dismissed && progress.completed < progress.total) return null;
  if (progress.completed >= progress.total) return null;

  const pct = Math.round((progress.completed / progress.total) * 100);

  function dismiss() {
    try {
      localStorage.setItem(CHECKLIST_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <section className="pf-workspace-panel overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Getting started
          </p>
          <h2 className="mt-1 text-sm font-bold text-[var(--pf-black)]">
            Your PortFuel launch checklist
          </h2>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            {progress.completed} of {progress.total} complete — about 5 minutes to a workspace that
            feels alive.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--pf-gray-500)] hover:bg-white hover:text-[var(--pf-black)]"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pf-gray-100)]">
          <div
            className="h-full rounded-full bg-[var(--pf-red)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="space-y-1 p-3 sm:p-4">
        {WORKSPACE_CHECKLIST_STEPS.map((step) => {
          const done = doneMap.get(step.id) ?? false;
          const Icon = step.icon;
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                  done
                    ? "border-emerald-200/80 bg-emerald-50/60"
                    : "pf-checklist-step-pending hover:border-[var(--pf-gray-300)]"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                    done
                      ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                      : "border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-gray-600)]"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      done ? "text-emerald-900" : "text-[var(--pf-black)]"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-[var(--pf-gray-500)]">
                    {step.description}
                  </p>
                </span>
                {!done ? (
                  <span className="shrink-0 text-xs font-semibold text-[var(--pf-red)]">Go →</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-[var(--pf-border)] px-5 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={dismiss} className="text-xs">
          Dismiss for now
        </Button>
      </div>
    </section>
  );
}
