"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import type { ParsedPostResult, ParsedPostTicker } from "@/lib/social/parse-post";
import { buildPublishUrlFromAnalysis } from "@/lib/social/desk-draft-url";
import { enrichFueledAnalysis } from "@/lib/ai/fueled-analysis-format";
import { formatPrice } from "@/lib/utils";
import { COPY } from "@/lib/copy";

type TickerAnalysisState = {
  loading: boolean;
  error: string;
  analysis: TickerAnalyzeResult | null;
  headlines: { headline: string; source: string; url: string }[];
  cost?: {
    modelId: string;
    promptTokensEstimate: number;
    outputTokensEstimate: number;
    estimatedCostUsd: number;
  };
  cacheHit?: boolean;
  lastMode?: "default" | "deep";
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
}: {
  ticker: ParsedPostTicker;
  tweetText: string;
  tweetUrl: string | null;
  adminNote: string;
}) {
  const [state, setState] = useState<TickerAnalysisState>({
    loading: false,
    error: "",
    analysis: null,
    headlines: [],
  });
  const [autoPublish, setAutoPublish] = useState(false);

  const contextNotes = buildContextNotes({
    tweetText,
    adminNote,
    inPostSnippet: ticker.inPostSnippet,
  });

  async function analyze(mode: "default" | "deep" = "default") {
    setState({ loading: true, error: "", analysis: null, headlines: [], lastMode: mode });
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
        const errorMessages: Record<string, string> = {
          invalid_symbol: "Invalid or unsupported symbol.",
          deep_limit_reached: "Deepen+ daily limit reached (25/day). Try again tomorrow or use Analyze.",
          deep_analysis_failed: "Deepen+ failed — try Analyze, or retry in a moment.",
          analysis_failed: "Analysis failed — try again.",
        };
        setState({
          loading: false,
          error: errorMessages[json.error as string] ?? "Analysis failed.",
          analysis: null,
          headlines: [],
        });
        return;
      }
      setState({
        loading: false,
        error: "",
        analysis: json.analysis as TickerAnalyzeResult,
        headlines: (json.headlines as { headline: string; source: string; url: string }[]) ?? [],
        cost: json.cost,
        cacheHit: Boolean(json.cache?.hit),
        lastMode: mode,
      });

      if (autoPublish && ticker.valid) {
        const href = buildPublishUrlFromAnalysis(ticker.symbol, json.analysis as TickerAnalyzeResult, {
          assetClass: ticker.assetClass ?? "equity",
          fueled: true,
          sourceTweetUrl: tweetUrl ?? undefined,
          socialMode: mode,
          contextNotes,
        });
        window.location.href = href;
      }
    } catch {
      setState({
        loading: false,
        error: "Analysis failed.",
        analysis: null,
        headlines: [],
      });
    }
  }

  const publishHref =
    state.analysis && ticker.valid
      ? buildPublishUrlFromAnalysis(ticker.symbol, state.analysis, {
          assetClass: ticker.assetClass ?? "equity",
          fueled: true,
          sourceTweetUrl: tweetUrl ?? undefined,
          socialMode: state.lastMode ?? "default",
          contextNotes,
        })
      : null;

  const quickPublishHref = buildPublishUrlFromAnalysis(
    ticker.symbol,
    enrichFueledAnalysis(
      {
        summary: "",
        risks: "Quick publish — verify catalysts, liquidity, and levels before going live.",
        draftThesis: ticker.inPostSnippet,
        direction: "long",
        entryPrice: ticker.lastPrice,
        targetPrice: null,
        stopPrice: null,
        timeframeNote: null,
      },
      ticker.lastPrice
    ),
    {
      assetClass: ticker.assetClass ?? "equity",
      fueled: true,
      sourceTweetUrl: tweetUrl ?? undefined,
      socialMode: "default",
      contextNotes,
    }
  );

  return (
    <li className="pf-workspace-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-[var(--pf-black)]">{ticker.symbol}</span>
            {ticker.name ? (
              <span className="text-xs text-[var(--pf-gray-500)]">{ticker.name}</span>
            ) : null}
            {!ticker.valid ? (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-700">
                Unverified
              </span>
            ) : null}
            {ticker.lastPrice != null ? (
              <span className="font-mono text-xs tabular-nums text-[var(--pf-gray-600)]">
                {formatPrice(ticker.lastPrice)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-700)]">{ticker.inPostSnippet}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={state.loading} onClick={() => void analyze("default")}>
            {state.loading ? "Analyzing…" : state.analysis ? "Re-analyze" : "Analyze"}
          </Button>
          {ticker.valid ? (
            <label className="pf-chip-action gap-2 px-2.5 py-1.5 text-xs">
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                disabled={state.loading}
              />
              Auto-open publish
            </label>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={state.loading}
            onClick={() => void analyze("deep")}
            title="Higher quality, costs more"
          >
            Deepen+
          </Button>
          {ticker.valid ? (
            <Link href={quickPublishHref}>
              <Button type="button" variant="outline" size="sm">
                Quick publish
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {(state.loading || state.error || state.analysis) && (
        <div className="mt-4 border-t border-[var(--pf-border)] pt-4">
          {state.loading ? (
            <p className="text-xs text-[var(--pf-gray-500)]">Researching {ticker.symbol}…</p>
          ) : null}
          {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
          {state.analysis ? (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                  Summary
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-800)]">{state.analysis.summary}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                  Risks
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-700)]">{state.analysis.risks}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">Draft thesis</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-800)]">{state.analysis.draftThesis}</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Direction</dt>
                  <dd className="font-semibold">{state.analysis.direction ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Entry</dt>
                  <dd className="font-semibold tabular-nums">{state.analysis.entryPrice ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Target</dt>
                  <dd className="font-semibold tabular-nums">{state.analysis.targetPrice ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--pf-gray-500)]">Stop</dt>
                  <dd className="font-semibold tabular-nums">{state.analysis.stopPrice ?? "—"}</dd>
                </div>
              </dl>
              {state.headlines.length > 0 ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                    Recent headlines
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {state.headlines.map((h) => (
                      <li key={h.url} className="text-xs">
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--pf-red)] hover:underline"
                        >
                          {h.headline}
                        </a>
                        <span className="text-[var(--pf-gray-500)]"> · {h.source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {state.cost ? (
                <p className="text-[10px] text-[var(--pf-gray-400)]">
                  {state.cacheHit ? "Cached · " : ""}
                  {state.cost.modelId} · ~{state.cost.promptTokensEstimate} in / ~
                  {state.cost.outputTokensEstimate} out · est ${state.cost.estimatedCostUsd}
                </p>
              ) : null}
              {publishHref ? (
                <Link href={publishHref}>
                  <Button size="sm">Publish Fueled call →</Button>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </li>
  );
}

export function AdminSocialInboundPanel() {
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
        const messages: Record<string, string> = {
          text_too_short: "Add a URL or paste at least a few lines of tweet text.",
          invalid_url: "That doesn't look like an X post URL.",
          invalid_input: "Paste a post URL or tweet text.",
          tweet_not_found:
            "That post wasn't found (deleted, private, or invalid URL). Paste the text below.",
          x_not_configured:
            "Could not load that URL — paste the tweet text below and try again.",
          fetch_failed: "Could not load that post. Paste the tweet text below and retry.",
        };
        setError(messages[json.error as string] ?? "Could not parse post.");
        if (
          json.error === "fetch_failed" ||
          json.error === "x_not_configured" ||
          json.error === "tweet_not_found"
        ) {
          setShowManual(true);
        }
        return;
      }
      setParsed(json as ParsedPostResult);
    } catch {
      setError("Could not parse post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        From X post
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
        Curate calls from social posts
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
        Paste an X post URL to pull tickers and context. Analyze each symbol with AI, then publish
        as Fueled from {COPY.newCall}. If the URL fails, paste the tweet text as backup.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="social-post-url">X post URL</Label>
          <Input
            id="social-post-url"
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
          {showManual ? "Hide manual text backup" : "Paste tweet text manually (backup)"}
        </button>

        {showManual ? (
          <div>
            <Label>Tweet / thread text</Label>
            <Textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={5}
              placeholder="Paste tweet text if URL fetch fails or for extra context…"
              className="mt-1.5"
            />
          </div>
        ) : null}

        <div>
          <Label>Admin note (optional)</Label>
          <Textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Why this post matters for the desk…"
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

        {parsed ? (
          <div className="space-y-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pf-gray-600)]">
              <span>
                Source:{" "}
                <strong className="text-[var(--pf-black)]">
                  {parsed.textSource === "fetched" ? "URL fetch" : "Pasted text"}
                </strong>
              </span>
              {parsed.authorUsername ? (
                <span>
                  · @{parsed.authorUsername}
                </span>
              ) : null}
              {parsed.tweetUrl ? (
                <a
                  href={parsed.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--pf-red)] hover:underline"
                >
                  Open post
                </a>
              ) : null}
            </div>

            {parsed.fetchWarning ? (
              <p className="text-xs text-amber-800">{parsed.fetchWarning}</p>
            ) : null}

            <blockquote className="border-l-2 border-[var(--pf-gray-300)] pl-3 text-sm leading-relaxed text-[var(--pf-gray-800)]">
              {parsed.tweetText}
            </blockquote>

            {parsed.tickers.length === 0 ? (
              <p className="text-sm text-[var(--pf-gray-600)]">
                No tickers found — try pasting more text or add cashtags like $NVDA.
              </p>
            ) : (
              <ul className="space-y-3">
                {parsed.tickers.map((ticker) => (
                  <TickerCard
                    key={ticker.symbol}
                    ticker={ticker}
                    tweetText={parsed.tweetText}
                    tweetUrl={parsed.tweetUrl}
                    adminNote={adminNote}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
