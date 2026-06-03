"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type DigestRow = {
  symbol: string;
  direction: string;
  returnPct: number;
  handle: string;
};

export function AdminWeeklyDigestPanel() {
  const [rows, setRows] = useState<DigestRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [chartKey, setChartKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social/weekly-digest");
      if (res.ok) {
        const json = (await res.json()) as {
          rows: DigestRow[];
          text: string | null;
          charCount: number;
        };
        setRows(json.rows);
        setText(json.text ?? "");
        setChartKey((k) => k + 1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(dryRun: boolean) {
    setPosting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/social/weekly-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error === "no_content" ? "Not enough qualifying calls this week." : "Publish failed.");
        return;
      }
      setText(json.text ?? text);
      setMessage(
        json.dryRun
          ? "Dry run complete — composite image generated server-side."
          : `Published (tweet ${json.tweetId ?? "—"}).`
      );
    } finally {
      setPosting(false);
    }
  }

  const chartUrl = `/api/admin/social/weekly-digest/chart?k=${chartKey}`;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Weekly digest
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
        Community week in review
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Top three member calls from the last 7 days (same +20% / 48h standards). Ships as a
        branded composite image plus tweet copy. Cron: enable{" "}
        <code className="rounded bg-[var(--pf-gray-100)] px-1 text-xs">X_POST_WEEKLY_DIGEST</code>{" "}
        (typically Mondays with leaderboard).
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">Loading week data…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pf-gray-500)]">
          No qualifying member calls in the last 7 days yet.
        </p>
      ) : (
        <>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {rows.map((r) => (
              <li
                key={r.symbol + r.handle}
                className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3"
              >
                <p className="font-semibold text-[var(--pf-black)]">${r.symbol}</p>
                <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
                  {r.direction} · {r.returnPct >= 0 ? "+" : ""}
                  {r.returnPct.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-[var(--pf-gray-500)]">{r.handle}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Composite asset
            </p>
            <Link
              href={chartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Open PNG
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[#0a0a0a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={chartKey}
              src={chartUrl}
              alt="Weekly digest composite preview"
              className="w-full"
            />
          </div>

          {text ? (
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Tweet copy
              </p>
              <pre className="mt-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {text}
              </pre>
              <p className="mt-1 text-xs text-[var(--pf-gray-500)]">{text.length} / 280 characters</p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={posting}
              onClick={() => void post(true)}
            >
              Dry run
            </Button>
            <Button type="button" size="sm" disabled={posting} onClick={() => void post(false)}>
              Publish to X
            </Button>
          </div>
        </>
      )}

      {message ? <p className="mt-3 text-sm text-[var(--pf-gray-600)]">{message}</p> : null}
    </section>
  );
}
