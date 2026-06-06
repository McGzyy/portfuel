"use client";

import { Check, Circle } from "lucide-react";
import { COPY } from "@/lib/copy";
import type { JournalResearchChecklist } from "@/lib/journal/checklist";
import { cn } from "@/lib/utils";

export function JournalResearchChecklistStrip({
  checklist,
  publishUrl,
  setupMode,
}: {
  checklist: JournalResearchChecklist;
  publishUrl: string;
  setupMode?: boolean;
}) {
  return (
    <section className="pf-workspace-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Research checklist
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            {checklist.requiredCompleted}/{checklist.requiredTotal} required steps
            {checklist.readyToPublish
              ? " — ready to publish a call when you want the community to see it."
              : setupMode
                ? " — start with thesis and plan below."
                : " — keep logging updates as your view develops."}
          </p>
        </div>
        {checklist.readyToPublish ? (
          <a
            href={publishUrl}
            className="inline-flex h-9 items-center rounded-lg bg-[var(--pf-red)] px-3.5 text-xs font-semibold text-white shadow-[var(--pf-shadow-sm)] hover:bg-[var(--pf-red-hover)]"
          >
            {COPY.publishFromJournal}
          </a>
        ) : null}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {checklist.items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2.5",
              item.done
                ? "border-emerald-200/80 bg-emerald-50/50"
                : "border-[var(--pf-border)] bg-[var(--pf-gray-50)]"
            )}
          >
            {item.done ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
            ) : (
              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--pf-gray-300)]" strokeWidth={2.25} />
            )}
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-[11px] font-semibold",
                  item.done ? "text-emerald-900" : "text-[var(--pf-gray-800)]"
                )}
              >
                {item.label}
                {item.optional ? (
                  <span className="ml-1 font-normal text-[var(--pf-gray-400)]">(optional)</span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-[var(--pf-gray-500)]">
                {item.hint}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
