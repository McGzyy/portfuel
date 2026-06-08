"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { JournalProgressMini } from "@/components/journal/JournalProgressMini";
import { compareJournalHubIncomplete } from "@/lib/journal/hub-summary";
import { journalSymbolPath } from "@/lib/journal/paths";
import { outcomeLabel, type JournalCatalyst } from "@/lib/watchlist/journal-meta";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { formatPct, formatPrice } from "@/lib/utils";

type FilterMode = "all" | "high" | "broken" | "needs_thesis" | "ready";

function journalRowHref(item: WatchlistEntry): string {
  if (!item.has_thesis) {
    return journalSymbolPath(item.symbol, { setup: true, section: "plan" });
  }
  if (item.journal_progress?.ready_to_publish) {
    return journalSymbolPath(item.symbol, { section: "checklist" });
  }
  if ((item.journal_progress?.manual_entry_count ?? 0) < 2) {
    return journalSymbolPath(item.symbol, { section: "entries" });
  }
  return journalSymbolPath(item.symbol, { section: "research" });
}

export function JournalIdeasPanel({
  demoMode,
  initialItems,
  initialFilter,
}: {
  demoMode: boolean;
  initialItems?: WatchlistEntry[];
  initialFilter?: FilterMode;
}) {
  const [items, setItems] = useState<WatchlistEntry[]>(initialItems ?? []);
  const [loading, setLoading] = useState(initialItems == null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterMode>(initialFilter ?? "all");
  const [catalystFilter, setCatalystFilter] = useState<JournalCatalyst | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load journal ideas.");
        return;
      }
      setItems((data.items ?? []) as WatchlistEntry[]);
    } catch {
      setError("Could not load journal ideas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialItems != null) {
      setItems(initialItems);
      setLoading(false);
      return;
    }
    void load();
  }, [load, initialItems]);

  const usedCatalysts = [...new Set(items.flatMap((i) => i.catalysts ?? []))].sort();

  function matchesFilters(item: WatchlistEntry): boolean {
    if (filter === "high" && (item.conviction ?? 0) < 8) return false;
    if (
      filter === "broken" &&
      item.outcome !== "invalidated" &&
      item.outcome !== "closed_incorrect"
    ) {
      return false;
    }
    if (filter === "needs_thesis" && item.has_thesis) return false;
    if (filter === "ready" && !item.journal_progress?.ready_to_publish) return false;
    if (catalystFilter && !(item.catalysts ?? []).includes(catalystFilter)) return false;
    return true;
  }

  const filtered = items.filter(matchesFilters).sort(compareJournalHubIncomplete);
  const readyCount = items.filter((i) => i.journal_progress?.ready_to_publish).length;

  return (
    <section
      id="journal-ideas"
      className="pf-workspace-panel p-4 sm:p-5 scroll-mt-24"
      aria-label="Journal ideas"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Research notebook
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Progress bars show thesis, plan, and logged updates — open any row to continue where
            you left off.
            {readyCount > 0 ? (
              <span className="font-semibold text-emerald-700">
                {" "}
                · {readyCount} ready to publish
              </span>
            ) : null}
          </p>
        </div>
        {demoMode ? (
          <span className="text-[10px] text-amber-700">Demo mode</span>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["ready", "Ready to publish"],
                ["high", "High conviction"],
                ["needs_thesis", "Needs thesis"],
                ["broken", "Broken"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  filter === id
                    ? id === "broken"
                      ? "bg-rose-700 text-white"
                      : id === "high"
                        ? "bg-indigo-600 text-white"
                        : id === "ready"
                          ? "bg-emerald-600 text-white"
                          : "bg-[var(--pf-black)] text-white"
                    : "border border-[var(--pf-border)] text-[var(--pf-gray-600)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {usedCatalysts.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Catalyst
              </span>
              {usedCatalysts.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setCatalystFilter((prev) => (prev === c ? null : (c as JournalCatalyst)))
                  }
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    catalystFilter === c
                      ? "bg-indigo-100 text-indigo-900 ring-1 ring-indigo-300"
                      : "border border-[var(--pf-border)] bg-white text-[var(--pf-gray-600)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-400)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-500)]">
          No symbols on your watchlist yet.{" "}
          <Link href="/dashboard/watchlist" className="font-semibold text-[var(--pf-red)] hover:underline">
            Add symbols on Watchlist
          </Link>{" "}
          — each gets a private journal automatically.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-500)]">
          No ideas match this filter.{" "}
          <button
            type="button"
            className="font-semibold text-[var(--pf-red)] hover:underline"
            onClick={() => {
              setFilter("all");
              setCatalystFilter(null);
            }}
          >
            Clear filters
          </button>
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((item) => (
            <li key={item.symbol}>
              <Link
                href={journalRowHref(item)}
                className="block rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3.5 py-3 transition-colors hover:border-[var(--pf-gray-300)] hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                      {item.symbol}
                    </span>
                    {item.conviction != null ? (
                      <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                        {item.conviction}/10
                      </span>
                    ) : null}
                    {!item.has_thesis ? (
                      <span className="pf-badge-attention">
                        Draft thesis
                      </span>
                    ) : item.journal_progress?.ready_to_publish ? (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Ready
                      </span>
                    ) : null}
                    {item.outcome && item.outcome !== "watching" ? (
                      <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[var(--pf-gray-600)] ring-1 ring-[var(--pf-border)]">
                        {outcomeLabel(item.outcome)}
                      </span>
                    ) : null}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700">
                    <Sparkles className="h-3 w-3" />
                    Continue
                  </span>
                </div>
                {item.journal_progress ? (
                  <JournalProgressMini progress={item.journal_progress} />
                ) : null}
                {item.last_price != null || item.change_since_add_pct != null ? (
                  <p className="mt-1 text-[10px] tabular-nums text-[var(--pf-gray-500)]">
                    {item.last_price != null ? `$${formatPrice(Number(item.last_price))}` : null}
                    {item.change_since_add_pct != null ? (
                      <span
                        className={
                          item.change_since_add_pct >= 0 ? " text-emerald-700" : " text-rose-700"
                        }
                      >
                        {" "}
                        · {(item.change_since_add_pct >= 0 ? "+" : "") +
                          formatPct(item.change_since_add_pct)}{" "}
                        since add
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {(item.catalysts ?? []).length > 0 ? (
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    {(item.catalysts ?? []).map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 ring-1 ring-indigo-100"
                      >
                        {c}
                      </span>
                    ))}
                  </p>
                ) : null}
                <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pf-red)]">
                  <BookOpen className="h-3 w-3" />
                  Open journal →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
