"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import {
  AdminXPostPreview,
  type AdminXPostPreviewData,
} from "@/components/admin/AdminXPostPreview";
import { formatPostError } from "@/lib/social/format-post-error";

type DigestRow = {
  symbol: string;
  direction: string;
  returnPct: number;
  handle: string;
};

type XConfigSummary = {
  livePostingReady: boolean;
  dryRun: boolean;
  bearerTokenSet: boolean;
};

export function AdminWeeklyDigestPanel() {
  const [rows, setRows] = useState<DigestRow[]>([]);
  const [text, setText] = useState("");
  const [xConfig, setXConfig] = useState<XConfigSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [chartKey, setChartKey] = useState(0);
  const [postPreview, setPostPreview] = useState<AdminXPostPreviewData | null>(null);
  const [forceRepost, setForceRepost] = useState(false);

  const chartUrl = "/api/admin/social/weekly-digest/chart";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social/weekly-digest");
      if (res.ok) {
        const json = (await res.json()) as {
          rows: DigestRow[];
          text: string | null;
          charCount: number;
          x: XConfigSummary;
        };
        setRows(json.rows);
        setText(json.text ?? "");
        setXConfig(json.x);
        setChartKey((k) => k + 1);
        if (json.text) {
          setPostPreview({
            lead: json.text,
            text: json.text,
            chartUrl,
            cacheKey: String(Date.now()),
            chartAlt: "Weekly digest composite preview",
          });
        } else {
          setPostPreview(null);
        }
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
        body: JSON.stringify({ dryRun, force: !dryRun && forceRepost }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "already_posted") {
          setMessage("Already published this week — enable Force repost to send again.");
          return;
        }
        setMessage(formatPostError(json.error as string));
        return;
      }
      const nextText = (json.text as string | undefined) ?? text;
      setText(nextText);
      setPostPreview({
        lead: nextText,
        text: nextText,
        chartUrl,
        cacheKey: String(Date.now()),
        chartAlt: "Weekly digest composite preview",
      });
      setChartKey((k) => k + 1);
      if (json.dryRun) {
        const size =
          typeof json.chartSizeBytes === "number"
            ? ` — chart ${(json.chartSizeBytes / 1024).toFixed(1)} KB`
            : "";
        setMessage(`Dry run complete${size}.`);
      } else {
        setMessage(`Published (tweet ${json.tweetId ?? "—"}).`);
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <section id="weekly-digest" className="pf-workspace-panel p-6">
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

      {xConfig ? (
        <MetricsStrip
          variant="embedded"
          className="mt-4 border-t border-[var(--pf-border)] pt-4 !px-0"
          eyebrow="X weekly digest"
          items={[
            {
              label: "Bearer",
              value: xConfig.bearerTokenSet ? "Set" : "Missing",
              accent: xConfig.bearerTokenSet ? "positive" : "negative",
            },
            {
              label: "Live post",
              value: xConfig.livePostingReady ? "Ready" : "Blocked",
              accent: xConfig.livePostingReady ? "positive" : undefined,
            },
            { label: "Dry run", value: xConfig.dryRun ? "On" : "Off" },
          ]}
        />
      ) : null}

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

          {postPreview ? (
            <div className="mt-6 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                  Full X post preview
                </p>
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <a
                    href={`${chartUrl}?k=${chartKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--pf-red)] hover:underline"
                  >
                    Open PNG
                  </a>
                  <a
                    href={`${chartUrl}?k=${chartKey}&download=1`}
                    download
                    className="text-[var(--pf-gray-700)] hover:underline"
                  >
                    Download PNG
                  </a>
                </div>
              </div>
              <AdminXPostPreview preview={postPreview} />
            </div>
          ) : null}

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--pf-gray-600)]">
            <input
              type="checkbox"
              className="accent-[var(--pf-red)]"
              checked={forceRepost}
              onChange={(e) => setForceRepost(e.target.checked)}
            />
            Force repost (ignore idempotency)
          </label>

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
            <Button
              type="button"
              size="sm"
              disabled={posting || !xConfig?.livePostingReady}
              title={
                xConfig?.livePostingReady
                  ? undefined
                  : "Set X_API_ENABLED, bearer token, and X_API_DRY_RUN=false for live posts"
              }
              onClick={() => void post(false)}
            >
              Publish to X
            </Button>
          </div>
        </>
      )}

      {message ? <p className="mt-3 text-sm text-[var(--pf-gray-600)]">{message}</p> : null}
    </section>
  );
}
