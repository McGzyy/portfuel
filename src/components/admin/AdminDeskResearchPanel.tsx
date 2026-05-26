"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeskWeekResearch } from "@/lib/desk/research";
import { timeAgo } from "@/lib/utils";

export function AdminDeskResearchPanel({
  onApplyWeeklyNote,
  onApplyPortfolioThesis,
}: {
  onApplyWeeklyNote: (text: string) => void;
  onApplyPortfolioThesis: (symbol: string, text: string) => void;
}) {
  const [data, setData] = useState<DeskWeekResearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/desk-research");
      const json = await res.json();
      if (!res.ok) {
        setError("Could not load headlines.");
        return;
      }
      setData(json as DeskWeekResearch);
    } catch {
      setError("Could not load headlines.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function draftFromHeadlines(opts: {
    kind: "weekly_note" | "portfolio_thesis";
    symbol?: string;
    direction?: "long" | "short";
  }) {
    const key = opts.symbol ?? "weekly";
    setDrafting(key);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/desk-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "headlines",
          kind: opts.kind,
          symbol: opts.symbol,
          direction: opts.direction,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "no_headlines") {
          setError(
            opts.symbol
              ? `No equity headlines for ${opts.symbol} this week — try manual bullets.`
              : "No headlines to summarize — add open equity positions to the portfolio first."
          );
        } else {
          setError("Draft failed.");
        }
        return;
      }
      const text = json.text as string;
      if (opts.kind === "weekly_note") {
        onApplyWeeklyNote(text);
        setMessage("Weekly note drafted — review and save below.");
      } else if (opts.symbol) {
        onApplyPortfolioThesis(opts.symbol, text);
        setMessage(`Thesis drafted for ${opts.symbol} — check the portfolio form below.`);
      }
    } catch {
      setError("Draft failed.");
    } finally {
      setDrafting(null);
    }
  }

  return (
    <div className="pf-workspace-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Research this week
          </p>
          <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
            Headlines from open model portfolio symbols ({data?.weekLabel ?? "7 days"}). Draft
            desk copy from news — you edit before publishing. Not investment advice.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {data && !data.finnhubConfigured ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          FINNHUB_API_KEY is missing — headlines will not load in production.
        </p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">Loading headlines…</p>
      ) : (data?.symbols.length ?? 0) === 0 ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">
          Add open positions to the model portfolio below, then refresh.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          <Button
            type="button"
            size="sm"
            disabled={drafting !== null}
            onClick={() => void draftFromHeadlines({ kind: "weekly_note" })}
          >
            {drafting === "weekly" ? "Drafting…" : "Draft weekly note from headlines"}
          </Button>

          {data?.symbols.map((s) => (
            <div key={s.symbol} className="rounded-lg border border-[var(--pf-border)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-bold text-[var(--pf-black)]">
                  {s.symbol}{" "}
                  <span className="font-sans text-xs font-normal text-[var(--pf-gray-500)]">
                    · {s.direction} · {s.asset_class}
                  </span>
                </p>
                {s.asset_class === "equity" && s.headlines.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={drafting !== null}
                    onClick={() =>
                      void draftFromHeadlines({
                        kind: "portfolio_thesis",
                        symbol: s.symbol,
                        direction: s.direction,
                      })
                    }
                  >
                    {drafting === s.symbol ? "Drafting…" : "Draft thesis"}
                  </Button>
                ) : null}
              </div>

              {s.note ? (
                <p className="mt-2 text-xs text-[var(--pf-gray-500)]">{s.note}</p>
              ) : null}

              {s.headlines.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {s.headlines.map((h) => (
                    <li key={`${h.url}-${h.datetime}`} className="text-sm">
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                      >
                        {h.headline}
                        <ExternalLink className="ml-1 inline h-3 w-3 opacity-50" />
                      </a>
                      <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
                        {h.source} · {timeAgo(new Date(h.datetime * 1000).toISOString())}
                        {h.summary ? ` · ${h.summary}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
