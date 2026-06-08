"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import {
  groupJournalRevisions,
  type JournalPlanRevision,
} from "@/lib/watchlist/journal-revisions";

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WatchlistJournalEditLog({
  revisions,
}: {
  revisions: JournalPlanRevision[];
}) {
  const groups = useMemo(() => groupJournalRevisions(revisions), [revisions]);

  if (groups.length === 0) {
    return (
      <section className="pf-workspace-panel p-4 sm:p-5" aria-label="Plan edit history">
        <div className="flex items-start gap-2">
          <History className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" aria-hidden />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Plan edit log
            </p>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              Saves to your thesis and plan are recorded here — what changed and when.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pf-workspace-panel p-4 sm:p-5" aria-label="Plan edit history">
      <div className="flex items-start gap-2">
        <History className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Plan edit log
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Every save to thesis, levels, catalysts, and outcome — private to you.
          </p>

          <ul className="mt-4 space-y-4">
            {groups.map((group) => (
              <li
                key={group.created_at}
                className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/50 px-3 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                  {fmtWhen(group.created_at)}
                </p>
                <ul className="mt-2 space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id} className="text-xs text-[var(--pf-gray-700)]">
                      <span className="font-semibold text-[var(--pf-black)]">
                        {item.field_label}
                      </span>
                      <div className="mt-1 grid gap-1 sm:grid-cols-2">
                        <p className="pf-edit-log-old px-2 py-1.5 text-[11px] leading-snug line-through">
                          {item.old_value ?? "—"}
                        </p>
                        <p className="pf-edit-log-new px-2 py-1.5 text-[11px] leading-snug">
                          {item.new_value ?? "—"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
