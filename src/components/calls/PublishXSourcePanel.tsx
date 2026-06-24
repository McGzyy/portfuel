"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import type { ParsedPostResult, ParsedPostTicker } from "@/lib/social/parse-post";
import { enrichFueledAnalysis } from "@/lib/ai/fueled-analysis-format";
import { formatFueledThesisForPublish } from "@/lib/ai/fueled-analysis-format";
import { normalizeTimeframeTag } from "@/lib/calls/timeframe-tag";
import { formatPrice } from "@/lib/utils";

export type PublishXApplyPayload = {
  symbol: string;
  assetClass: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  targetPrice?: number | null;
  stopPrice?: number | null;
  timeframeTag?: string | null;
  sourceTweetUrl?: string;
  socialMode?: "default" | "deep";
};

function buildContextNotes(input: {
  tweetText: string;
  adminNote: string;
  inPostSnippet: string;
}): string {
  const parts = [
    input.inPostSnippet.trim(),
    input.tweetText.trim() !== input.inPostSnippet.trim() ? input.tweetText.trim() : "",
    input.adminNote.trim() ? `Admin: ${input.adminNote.trim()}` : "",
  ].filter(Boolean);
  return parts.join("\n\n").slice(0, 1500);
}

function TickerCard({
  ticker,
  tweetText,
  tweetUrl,
  adminNote,
  onApply,
}: {
  ticker: ParsedPostTicker;
  tweetText: string;
  tweetUrl: string | null;
  adminNote: string;
  onApply: (payload: PublishXApplyPayload) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<TickerAnalyzeResult | null>(null);
  const [lastMode, setLastMode] = useState<"default" | "deep">("default");

  const contextNotes = buildContextNotes({
    tweetText,
    adminNote,
    inPostSnippet: ticker.inPostSnippet,
  });

  function applyAnalysis(a: TickerAnalyzeResult, mode: "default" | "deep") {
    onApply({
      symbol: ticker.symbol,
      assetClass: (ticker.assetClass ?? "equity") as "equity" | "crypto",
      direction: a.direction ?? "long",
      thesis: formatFueledThesisForPublish(a),
      targetPrice: a.targetPrice,
      stopPrice: a.stopPrice,
      timeframeTag: a.timeframeNote ? normalizeTimeframeTag(a.timeframeNote) : undefined,
      sourceTweetUrl: tweetUrl ?? undefined,
      socialMode: mode,
    });
  }

  async function analyze(mode: "default" | "deep" = "default") {
    setLoading(true);
    setError("");
    setAnalysis(null);
    setLastMode(mode);
    try {
      const res = await fetch("/api/admin/social/analyze-ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: tweetText,
          tweetUrl,
          symbol: ticker.symbol,
          inPostSnippet: ticker.inPostSnippet,
          adminNote: adminNote || undefined,
          assetClass: ticker.assetClass ?? undefined,
          mode,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Analysis failed.");
        return;
      }
      const a = json.analysis as TickerAnalyzeResult;
      setAnalysis(a);
      applyAnalysis(a, mode);
    } catch {
      setError("Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function quickApply() {
    const a = enrichFueledAnalysis(
      {
        summary: "",
        risks: "Quick apply — verify catalysts and levels before publishing.",
        draftThesis: ticker.inPostSnippet,
        direction: "long",
        entryPrice: ticker.lastPrice,
        targetPrice: null,
        stopPrice: null,
        timeframeNote: null,
      },
      ticker.lastPrice
    );
    onApply({
      symbol: ticker.symbol,
      assetClass: (ticker.assetClass ?? "equity") as "equity" | "crypto",
      direction: a.direction ?? "long",
      thesis: a.draftThesis,
      sourceTweetUrl: tweetUrl ?? undefined,
    });
  }

  return (
    <li className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold">{ticker.symbol}</span>
            {ticker.lastPrice != null ? (
              <span className="font-mono text-xs tabular-nums text-[var(--pf-gray-500)]">
                {formatPrice(ticker.lastPrice)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-700)]">
            {ticker.inPostSnippet}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || !ticker.valid}
            onClick={() => void analyze("default")}
          >
            {loading ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze & fill"}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={() => void analyze("deep")}>
            Deepen+
          </Button>
          {ticker.valid ? (
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={quickApply}>
              Quick fill
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
      {analysis ? (
        <p className="mt-2 text-xs text-emerald-700">
          Form updated from {lastMode === "deep" ? "Deepen+" : "Analyze"} · review below before publishing.
        </p>
      ) : null}
    </li>
  );
}

export function PublishXSourcePanel({
  onApply,
}: {
  onApply: (payload: PublishXApplyPayload) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParsedPostResult | null>(null);

  async function loadPost() {
    setLoading(true);
    setError("");
    setParsed(null);
    try {
      const res = await fetch("/api/admin/social/parse-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: postUrl.trim() || undefined,
          rawText: manualText.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Could not parse post.");
        if (json.error === "fetch_failed" || json.error === "x_not_configured") {
          setShowManual(true);
        }
        return;
      }
      setParsed(json as ParsedPostResult);
      setExpanded(true);
    } catch {
      setError("Could not parse post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <p className="pf-eyebrow">Source from X</p>
          <p className="text-sm text-[var(--pf-gray-600)]">
            Optional — paste a post URL, pick a ticker, analyze into the form below.
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--pf-gray-400)]" />
        )}
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-[var(--pf-border)] px-4 py-4">
          <div>
            <Label htmlFor="publish-x-url">X post URL</Label>
            <Input
              id="publish-x-url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://x.com/handle/status/1234567890"
              className="mt-1.5"
            />
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
            onClick={() => setShowManual((v) => !v)}
          >
            {showManual ? "Hide manual text" : "Paste tweet text manually"}
          </button>
          {showManual ? (
            <Textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={4}
              placeholder="Tweet text if URL fetch fails…"
            />
          ) : null}
          <div>
            <Label>Admin note (optional)</Label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>
          <Button
            type="button"
            disabled={loading || (!postUrl.trim() && manualText.trim().length < 12)}
            onClick={() => void loadPost()}
          >
            {loading ? "Loading…" : "Load post"}
          </Button>
          {error ? <p className="text-xs text-rose-700">{error}</p> : null}
          {parsed?.tickers.length ? (
            <ul className="space-y-3">
              {parsed.tickers.map((ticker) => (
                <TickerCard
                  key={ticker.symbol}
                  ticker={ticker}
                  tweetText={parsed.tweetText}
                  tweetUrl={parsed.tweetUrl}
                  adminNote={adminNote}
                  onApply={onApply}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
