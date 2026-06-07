"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { JournalAiResearchEntryBody } from "@/components/journal/JournalResearchPanel";
import { COPY } from "@/lib/copy";
import {
  JOURNAL_ENTRY_PLACEHOLDERS,
  JOURNAL_ENTRY_TYPES,
  journalEntryTypeLabel,
  type JournalEntryType,
} from "@/lib/watchlist/journal-meta";
import type { WatchlistJournalEntry } from "@/lib/watchlist/journal-types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type FilterMode = "all" | JournalEntryType;

const TYPE_CHIP_STYLE: Partial<Record<JournalEntryType, string>> = {
  price_action: "bg-sky-50 text-sky-800 ring-sky-100",
  earnings: "bg-violet-50 text-violet-800 ring-violet-100",
  news: "bg-amber-50 text-amber-900 ring-amber-100",
  thesis_update: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  ai_research: "bg-indigo-100 text-indigo-900 ring-indigo-200",
  system: "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)] ring-[var(--pf-border)]",
};

export function WatchlistJournalTimeline({
  symbol,
  entries,
  onEntryAdded,
  prefillEntryType,
}: {
  symbol: string;
  entries: WatchlistJournalEntry[];
  onEntryAdded: (entry: WatchlistJournalEntry) => void;
  prefillEntryType?: JournalEntryType;
}) {
  const initialType =
    prefillEntryType && prefillEntryType !== "ai_research" && prefillEntryType !== "system"
      ? prefillEntryType
      : "note";
  const [body, setBody] = useState("");
  const [entryType, setEntryType] = useState<(typeof JOURNAL_ENTRY_TYPES)[number]["value"]>(
    initialType as (typeof JOURNAL_ENTRY_TYPES)[number]["value"]
  );
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");

  const byId = new Map(entries.map((e) => [e.id, e]));

  const visible = useMemo(() => {
    if (filter === "all") return [...entries].reverse();
    return [...entries].filter((e) => e.entry_type === filter).reverse();
  }, [entries, filter]);

  const usedTypes = useMemo(
    () => [...new Set(entries.map((e) => e.entry_type))],
    [entries]
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#journal-entry-")) return;

    const entryId = decodeURIComponent(hash.slice("#journal-entry-".length));
    const entry = entries.find((row) => row.id === entryId);
    if (!entry) return;

    if (filter !== "all" && filter !== entry.entry_type) {
      setFilter("all");
    }

    const id = window.requestAnimationFrame(() => {
      const node = document.getElementById(`journal-entry-${entryId}`);
      if (!node) return;
      node.scrollIntoView({ block: "center", behavior: "smooth" });
      node.classList.add("ring-2", "ring-[var(--pf-red)]/40", "ring-offset-2");
      window.setTimeout(() => {
        node.classList.remove("ring-2", "ring-[var(--pf-red)]/40", "ring-offset-2");
      }, 2400);
    });

    return () => window.cancelAnimationFrame(id);
  }, [entries, filter]);

  const placeholder =
    JOURNAL_ENTRY_PLACEHOLDERS[entryType] ??
    "Earnings beat — revenue accelerated. Raised conviction…";

  useEffect(() => {
    if (!prefillEntryType || prefillEntryType === "ai_research" || prefillEntryType === "system") {
      return;
    }
    setEntryType(prefillEntryType);
  }, [prefillEntryType]);

  async function postEntry(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/watchlist/${encodeURIComponent(symbol)}/journal/entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text, reply_to_id: replyTo, entry_type: entryType }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError("Could not add entry.");
        return;
      }
      const entry = data.entry as WatchlistJournalEntry;
      onEntryAdded(entry);
      setBody("");
      setReplyTo(null);
      setFilter("all");
    } catch {
      setError("Could not add entry.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="pf-workspace-panel p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Journal timeline
      </p>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        Log earnings, news, and price action — each update can pin a marker on your chart. AI
        research saves here automatically.
      </p>

      {usedTypes.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          {usedTypes.map((t) => (
            <FilterChip
              key={t}
              active={filter === t}
              onClick={() => setFilter(t)}
              label={journalEntryTypeLabel(t)}
            />
          ))}
        </div>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">
          No updates yet. Log what changed your view after earnings, news, or price action.
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">No entries match this filter.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((entry) => {
            const parent = entry.reply_to_id ? byId.get(entry.reply_to_id) : null;
            const isSystem = entry.entry_type === "system";
            return (
              <li
                key={entry.id}
                id={`journal-entry-${entry.id}`}
                className={
                  entry.reply_to_id
                    ? "ml-4 border-l-2 border-[var(--pf-border)] pl-4"
                    : undefined
                }
              >
                <div
                  className={cn(
                    "rounded-lg border px-3.5 py-3",
                    isSystem
                      ? "border-transparent bg-transparent px-1 py-1"
                      : "border-[var(--pf-border)] bg-[var(--pf-gray-50)]"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                      {fmtWhen(entry.created_at)}
                    </time>
                    <span className="flex items-center gap-2">
                      {!isSystem ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                            TYPE_CHIP_STYLE[entry.entry_type] ??
                              "bg-white text-[var(--pf-gray-700)] ring-[var(--pf-border)]"
                          )}
                        >
                          {journalEntryTypeLabel(entry.entry_type)}
                        </span>
                      ) : null}
                      {entry.marker_price != null ? (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          ${formatPrice(entry.marker_price)} on chart
                        </span>
                      ) : null}
                      {entry.conviction_after != null ? (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[var(--pf-red)]">
                          Conviction {entry.conviction_after}/10
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {parent ? (
                    <p className="mt-2 text-[10px] text-[var(--pf-gray-500)]">
                      Reply · {parent.body.slice(0, 80)}
                      {parent.body.length > 80 ? "…" : ""}
                    </p>
                  ) : null}
                  {entry.entry_type === "ai_research" ? (
                    <JournalAiResearchEntryBody metadata={entry.metadata} body={entry.body} />
                  ) : (
                    <p
                      className={cn(
                        "whitespace-pre-wrap leading-relaxed",
                        isSystem
                          ? "mt-1 text-[11px] italic text-[var(--pf-gray-500)]"
                          : "mt-2 text-sm text-[var(--pf-gray-800)]"
                      )}
                    >
                      {entry.body}
                    </p>
                  )}
                  {!isSystem && entry.entry_type !== "ai_research" ? (
                    <button
                      type="button"
                      onClick={() => setReplyTo(entry.id)}
                      className="mt-2 text-[10px] font-semibold text-[var(--pf-red)] hover:underline"
                    >
                      Reply
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={postEntry} className="mt-4 space-y-2 border-t border-[var(--pf-border)] pt-4">
        {replyTo ? (
          <p className="text-xs text-[var(--pf-gray-600)]">
            Replying to an update.{" "}
            <button
              type="button"
              className="font-semibold text-[var(--pf-red)] hover:underline"
              onClick={() => setReplyTo(null)}
            >
              Cancel reply
            </button>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {JOURNAL_ENTRY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setEntryType(t.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                entryType === t.value
                  ? "bg-[var(--pf-black)] text-white"
                  : "border border-[var(--pf-border)] text-[var(--pf-gray-600)] hover:border-[var(--pf-gray-300)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          className="min-h-[88px]"
          maxLength={4000}
        />
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <Button type="submit" size="sm" variant="secondary" disabled={posting || !body.trim()}>
          {posting ? COPY.journalAddingEntry : COPY.journalAddEntry}
        </Button>
      </form>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
        active
          ? "bg-indigo-600 text-white"
          : "border border-[var(--pf-border)] text-[var(--pf-gray-600)]"
      )}
    >
      {label}
    </button>
  );
}
