"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { WatchlistJournalEntry } from "@/lib/watchlist/journal-types";
import { formatPrice } from "@/lib/utils";

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WatchlistJournalTimeline({
  symbol,
  entries,
  onEntryAdded,
}: {
  symbol: string;
  entries: WatchlistJournalEntry[];
  onEntryAdded: (entry: WatchlistJournalEntry) => void;
}) {
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const byId = new Map(entries.map((e) => [e.id, e]));

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
          body: JSON.stringify({ body: text, reply_to_id: replyTo }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError("Could not add update.");
        return;
      }
      const entry = data.entry as WatchlistJournalEntry;
      onEntryAdded(entry);
      setBody("");
      setReplyTo(null);
    } catch {
      setError("Could not add update.");
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
        Each update pins an indigo marker on your chart at the current price. Reply to build a
        thread on this idea.
      </p>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">
          No updates yet. Log what changed your view after earnings, news, or price action.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => {
            const parent = entry.reply_to_id ? byId.get(entry.reply_to_id) : null;
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
                <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3.5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                      {fmtWhen(entry.created_at)}
                    </time>
                    <span className="flex items-center gap-2">
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
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--pf-gray-800)]">
                    {entry.body}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReplyTo(entry.id)}
                    className="mt-2 text-[10px] font-semibold text-[var(--pf-red)] hover:underline"
                  >
                    Reply
                  </button>
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
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Earnings beat — revenue accelerated. Raised conviction…"
          className="min-h-[88px]"
          maxLength={4000}
        />
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <Button type="submit" size="sm" variant="secondary" disabled={posting || !body.trim()}>
          {posting ? "Posting…" : "Add update"}
        </Button>
      </form>
    </section>
  );
}
