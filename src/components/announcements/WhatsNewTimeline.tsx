"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import type { ChangelogEntry } from "@/lib/announcements/changelog";
import { cn, timeAgo } from "@/lib/utils";

const SEVERITY_DOT: Record<ChangelogEntry["severity"], string> = {
  info: "bg-slate-400",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
};

function formatReleaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WhatsNewTimeline({ initialEntries }: { initialEntries: ChangelogEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);

  async function dismiss(id: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, dismissed: true } : e))
    );
    try {
      await fetch(`/api/announcements/${id}/dismiss`, { method: "POST" });
    } catch {
      /* optimistic */
    }
  }

  if (entries.length === 0) {
    return (
      <div className="pf-workspace-panel px-6 py-14 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-[var(--pf-gray-300)]" />
        <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">No releases yet</p>
        <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
          Product updates and improvements will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="pf-workspace-panel overflow-hidden">
      <ul className="divide-y divide-[var(--pf-border)]">
        {entries.map((entry, index) => {
          const isNew = entry.isLive && !entry.dismissed;
          return (
            <li
              key={entry.id}
              className={cn(
                "relative px-5 py-5 sm:px-6",
                isNew && "bg-[color-mix(in_srgb,var(--pf-red)_4%,transparent)]"
              )}
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center pt-1">
                  <span
                    className={cn("h-2.5 w-2.5 shrink-0 rounded-full", SEVERITY_DOT[entry.severity])}
                  />
                  {index < entries.length - 1 ? (
                    <span className="mt-1 w-px flex-1 bg-[var(--pf-border)]" aria-hidden />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <time
                      className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--pf-gray-400)]"
                      dateTime={entry.starts_at}
                    >
                      {formatReleaseDate(entry.starts_at)}
                    </time>
                    {isNew ? (
                      <span className="rounded-full bg-[var(--pf-red)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        New
                      </span>
                    ) : entry.dismissed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                        <Check className="h-3 w-3" />
                        Read
                      </span>
                    ) : null}
                    {!entry.isLive ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                        Archived
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-[var(--foreground)]">
                    {entry.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)] whitespace-pre-wrap">
                    {entry.body}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {entry.link_url ? (
                      <Link
                        href={entry.link_url}
                        className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
                      >
                        {entry.link_label ?? "Learn more"} →
                      </Link>
                    ) : null}
                    <span className="text-xs text-[var(--pf-gray-400)]">
                      Posted {timeAgo(entry.starts_at)}
                    </span>
                  </div>
                </div>
                {isNew ? (
                  <button
                    type="button"
                    onClick={() => void dismiss(entry.id)}
                    className="shrink-0 rounded-lg p-2 text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-100)]"
                    aria-label="Mark as read"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
