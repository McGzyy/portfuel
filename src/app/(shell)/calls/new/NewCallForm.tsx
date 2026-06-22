"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NewCallPageHeader } from "@/components/calls/NewCallPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TradeSetupPreview } from "@/components/calls/TradeSetupPreview";
import { ThesisCoachPanel } from "@/components/ai/ThesisCoachPanel";
import { PublishCallCardPreview } from "@/components/calls/PublishCallCardPreview";
import { PublishIdentitySwitcher } from "@/components/calls/PublishIdentitySwitcher";
import {
  PublishXSourcePanel,
  type PublishXApplyPayload,
} from "@/components/calls/PublishXSourcePanel";
import { MemberQuotaStrip } from "@/components/member/MemberQuotaStrip";
import type { SessionPayload } from "@/lib/auth/session-types";
import type { HeaderUser } from "@/lib/auth/session-user";
import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import { formatFueledThesisForPublish } from "@/lib/ai/fueled-analysis-format";
import { formatDiscoveryDraftForPublish, parseLevelNote } from "@/lib/desk-discovery/draft-types";
import type { DiscoveryDraftPayload } from "@/lib/desk-discovery/draft-types";
import { journalSymbolPath } from "@/lib/journal/paths";
import { COPY } from "@/lib/copy";
import { formatPrice } from "@/lib/utils";

function readPublishQuery(sp: URLSearchParams) {
  const directionParam = sp.get("direction");
  return {
    fromTweet: sp.get("from") === "tweet",
    fromJournal: sp.get("from") === "journal",
    publishFueled: sp.get("fueled") === "1",
    socialMode: sp.get("socialMode") ?? "",
    direction:
      directionParam === "short" ? ("short" as const) : ("long" as const),
    thesis: sp.get("thesis") ?? "",
    entryPrice: sp.get("entry") ?? "",
    targetPrice: sp.get("target") ?? "",
    stopPrice: sp.get("stop") ?? "",
    timeframeTag: sp.get("timeframe") ?? "",
    sourceTweetUrl: sp.get("sourceTweet") ?? "",
    contextNotes: sp.get("notes") ?? "",
    conviction: sp.get("conviction") ?? "",
    catalysts: (sp.get("catalysts") ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  };
}

export function NewCallForm({
  user,
  weeklyQuota,
  showUpgrade,
  isPro,
  isAdmin = false,
  isDeskIdentity = false,
  role,
  canPublishCalls,
}: {
  user: HeaderUser;
  weeklyQuota: WeeklyQuotaStatus;
  showUpgrade?: boolean;
  isPro: boolean;
  isAdmin?: boolean;
  /** Admin desk identity — all publishes are Fueled. */
  isDeskIdentity?: boolean;
  role: SessionPayload["role"];
  canPublishCalls: boolean;
}) {
  const publishBlocked = role !== "admin" && !canPublishCalls;
  const quotaBlocked = !isDeskIdentity && weeklyQuota.remaining === 0;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDraft = readPublishQuery(searchParams);
  const fromJournal = queryDraft.fromJournal;
  const journalPrefilled = fromJournal && queryDraft.thesis.trim().length >= 10;
  const initialAsset =
    searchParams.get("asset") === "crypto" ? "crypto" : "equity";
  const initialSymbol = (searchParams.get("symbol") ?? "").toUpperCase();
  const discoveryCandidateId = searchParams.get("discoveryId") ?? "";
  const fromDiscovery = Boolean(discoveryCandidateId);

  const [assetClass, setAssetClass] = useState<"equity" | "crypto">(initialAsset);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [symbolHint, setSymbolHint] = useState("");
  const [symbolValid, setSymbolValid] = useState<boolean | null>(null);
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [direction, setDirection] = useState<"long" | "short">(queryDraft.direction);
  const [thesis, setThesis] = useState(queryDraft.thesis);
  const [entryPrice, setEntryPrice] = useState(queryDraft.entryPrice);
  const [targetPrice, setTargetPrice] = useState(queryDraft.targetPrice);
  const [stopPrice, setStopPrice] = useState(queryDraft.stopPrice);
  const [timeframeTag, setTimeframeTag] = useState(queryDraft.timeframeTag);
  const [sourceTweetUrl, setSourceTweetUrl] = useState(queryDraft.sourceTweetUrl);
  const [entryMode, setEntryMode] = useState<"live" | "conditional">("live");
  const [triggerEntryPrice, setTriggerEntryPrice] = useState("");
  const [aiMode, setAiMode] = useState<"default" | "deep">(
    queryDraft.socialMode === "deep" ? "deep" : "default"
  );
  const [aiNotes, setAiNotes] = useState(queryDraft.contextNotes);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCost, setAiCost] = useState<number | null>(null);
  const [aiCacheHit, setAiCacheHit] = useState<boolean | null>(null);
  const [aiRemaining, setAiRemaining] = useState<{ default: number; deep: number } | null>(
    null
  );
  const [aiDraftRawText, setAiDraftRawText] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(fromDiscovery);
  const [discoveryReady, setDiscoveryReady] = useState(false);

  function applyDiscoveryDraft(draft: DiscoveryDraftPayload) {
    setDirection(draft.direction);
    setThesis(formatDiscoveryDraftForPublish(draft));
    if (draft.timeframe.trim()) setTimeframeTag(draft.timeframe.trim());
    const target = parseLevelNote(draft.targetNote);
    const stop = parseLevelNote(draft.stopNote);
    if (target != null) setTargetPrice(String(target));
    if (stop != null) setStopPrice(String(stop));
  }

  useEffect(() => {
    if (!fromDiscovery || !discoveryCandidateId) return;
    let cancelled = false;
    void (async () => {
      setDiscoveryLoading(true);
      try {
        const res = await fetch(`/api/admin/desk-discovery/${discoveryCandidateId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.candidate) {
          setError("Could not load discovery candidate — return to Discovery and queue the symbol first.");
          return;
        }
        const candidate = data.candidate as {
          symbol: string;
          assetClass: "equity" | "crypto";
          status: string;
          draft: DiscoveryDraftPayload | null;
        };
        if (candidate.status !== "approved") {
          setError(
            "This symbol is not in the Ready to publish queue. Approve it in Discovery first."
          );
          return;
        }
        setSymbol(candidate.symbol);
        setAssetClass(candidate.assetClass);
        if (candidate.draft) applyDiscoveryDraft(candidate.draft);
        setDiscoveryReady(true);
      } catch {
        if (!cancelled) setError("Could not load discovery candidate.");
      } finally {
        if (!cancelled) setDiscoveryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromDiscovery, discoveryCandidateId]);

  async function refreshAiAssistUsage() {
    if (!isAdmin && !isPro) return;
    try {
      const res = await fetch("/api/social/analyze-ticker/usage");
      if (!res.ok) return;
      const data = await res.json();
      setAiRemaining({
        default: Number(data?.default?.remaining ?? 0),
        deep: Number(data?.deep?.remaining ?? 0),
      });
    } catch {
      // ignore
    }
  }

  async function generateAiDraft() {
    if (!isAdmin && !isPro) return;
    if (!symbol || symbol.trim().length < 1) return;
    setError("");
    setAiLoading(true);
    setAiCost(null);
    setAiCacheHit(null);
    try {
      await refreshAiAssistUsage();
      const rawText = `Ticker: ${symbol.toUpperCase().trim()}\nNotes: ${aiNotes.trim() || "None"}`;
      const endpoint = isAdmin ? "/api/admin/social/analyze-ticker" : "/api/social/analyze-ticker";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          symbol: symbol.toUpperCase().trim(),
          inPostSnippet: aiNotes.trim().slice(0, 500) || undefined,
          adminNote: aiNotes.trim().slice(0, 500) || undefined,
          assetClass,
          mode: aiMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = typeof data.error === "string" ? data.error : "AI draft failed.";
        if (code === "pro_required") {
          setError("Pro required to use AI assist.");
        } else if (code === "ai_limit_reached") {
          setError("AI assist limit reached for today.");
        } else if (code === "ai_deep_limit_reached") {
          setError("Deepen+ limit reached for today.");
        } else {
          setError(code);
        }
        return;
      }

      const analysis = data.analysis as TickerAnalyzeResult;

      setThesis(formatFueledThesisForPublish(analysis));
      if (analysis.direction) setDirection(analysis.direction);
      if (analysis.entryPrice != null && entryMode === "live") {
        setEntryPrice(String(analysis.entryPrice));
      }
      if (analysis.targetPrice != null) setTargetPrice(String(analysis.targetPrice));
      if (analysis.stopPrice != null) setStopPrice(String(analysis.stopPrice));
      if (analysis.timeframeNote) setTimeframeTag(analysis.timeframeNote);

      setAiDraftRawText(rawText);
      setAiCost(
        typeof data.cost?.estimatedCostUsd === "number" ? data.cost.estimatedCostUsd : null
      );
      setAiCacheHit(typeof data.cache?.hit === "boolean" ? data.cache.hit : null);
      await refreshAiAssistUsage();
    } catch {
      setError("AI draft failed.");
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    void refreshAiAssistUsage();
    if (!symbol || symbol.length < 2) {
      setSymbolHint("");
      setSymbolValid(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/symbols/validate?symbol=${encodeURIComponent(symbol)}&assetClass=${assetClass}`
      );
      const data = await res.json();
      if (data.ok) {
        setSymbolValid(true);
        setSymbolHint(data.name ? data.name : "Valid symbol");
        setMarketPrice(typeof data.lastPrice === "number" ? data.lastPrice : null);
      } else {
        setSymbolValid(false);
        setSymbolHint(data.error ?? "Invalid symbol");
        setMarketPrice(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [symbol, assetClass]);

  useEffect(() => {
    if (entryMode === "live" && marketPrice != null) {
      setEntryPrice(String(marketPrice));
    }
  }, [entryMode, marketPrice]);

  function applyXPayload(payload: PublishXApplyPayload) {
    setSymbol(payload.symbol.toUpperCase());
    setAssetClass(payload.assetClass);
    setDirection(payload.direction);
    setThesis(payload.thesis);
    if (payload.targetPrice != null) setTargetPrice(String(payload.targetPrice));
    if (payload.stopPrice != null) setStopPrice(String(payload.stopPrice));
    if (payload.timeframeTag) setTimeframeTag(payload.timeframeTag);
    if (payload.sourceTweetUrl) setSourceTweetUrl(payload.sourceTweetUrl);
    if (payload.socialMode) setAiMode(payload.socialMode);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const modeToSend: "default" | "deep" | undefined =
        isAdmin && sourceTweetUrl
          ? queryDraft.socialMode === "deep"
            ? "deep"
            : "default"
          : isAdmin && aiDraftRawText
            ? aiMode
            : undefined;
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          assetClass,
          direction,
          thesis,
          entryMode,
          triggerEntryPrice:
            entryMode === "conditional" && triggerEntryPrice
              ? parseFloat(triggerEntryPrice)
              : undefined,
          targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
          stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
          timeframeTag: timeframeTag || undefined,
          sourceTweetUrl: isAdmin && sourceTweetUrl ? sourceTweetUrl : undefined,
          socialAnalysisMode: modeToSend,
          socialAnalysisRawText:
            isAdmin && !sourceTweetUrl && aiDraftRawText ? aiDraftRawText : undefined,
          discoveryCandidateId:
            isDeskIdentity && discoveryCandidateId ? discoveryCandidateId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "publish_restricted") {
          setError("Your account cannot publish new calls right now.");
        } else if (data.error === "quota_exceeded") {
          setError(
            showUpgrade
              ? `Weekly limit reached (${data.quota} calls this week). Upgrade to Pro in billing for 6 calls/week.`
              : `Weekly limit reached (${data.quota} calls this week). Your quota resets on a rolling 7-day window.`
          );
        } else if (data.error === "trigger_must_be_below_market") {
          setError("For a long bottom call, entry trigger must be below the current price.");
        } else if (data.error === "trigger_must_be_above_market") {
          setError("For a short top call, entry trigger must be above the current price.");
        } else if (data.error === "trigger_required") {
          setError("Enter a trigger price for a conditional entry call.");
        } else if (data.error === "discovery_not_ready") {
          setError("Queue this symbol in Discovery (Ready to publish) before publishing.");
        } else if (data.error === "discovery_link_failed") {
          setError("Call saved but discovery link failed — check Admin → Discovery.");
        } else {
          setError(typeof data.error === "string" ? data.error : "Could not submit call.");
        }
        return;
      }
      router.push(`/ticker/${data.call.symbol}?published=1`);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const showFeedPreview =
    symbol.trim().length > 0 && thesis.trim().length >= 10;
  const liveEntryDisplay =
    entryMode === "live" && marketPrice != null ? String(marketPrice) : entryPrice;
  const showTradeSetup =
    Boolean(liveEntryDisplay || targetPrice || stopPrice || triggerEntryPrice) &&
    (showFeedPreview || journalPrefilled);

  return (
    <div className="space-y-6">
      <NewCallPageHeader
        weeklyQuota={weeklyQuota}
        fueledMode={isDeskIdentity}
        prefilledSymbol={symbol.trim() || undefined}
        backHref={
          fromJournal && initialSymbol
            ? journalSymbolPath(initialSymbol)
            : "/dashboard"
        }
        backLabel={
          fromJournal && initialSymbol ? `${initialSymbol} journal` : "Workspace overview"
        }
      />

      <MemberQuotaStrip quota={weeklyQuota} showUpgrade={showUpgrade} className="mb-6" />

      {fromDiscovery ? (
        <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-[var(--pf-red)]/25 bg-[var(--pf-red-muted)] px-4 py-3 text-sm text-[var(--pf-gray-800)]">
          {discoveryLoading ? (
            <span>Loading thesis from Discovery radar…</span>
          ) : discoveryReady ? (
            <>
              <span className="font-semibold">From Discovery radar.</span> Thesis pre-filled from your
              review queue — confirm levels and publish as Fueled.
            </>
          ) : (
            <span>Discovery candidate not ready — return to Admin → Discovery.</span>
          )}
        </div>
      ) : null}

      {queryDraft.fromTweet ? (
        <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Prefilled from a social draft — confirm symbol, levels, and thesis before publishing.
        </div>
      ) : null}

      {journalPrefilled ? (
        <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-indigo-200/80 bg-indigo-50 px-4 py-3 text-sm text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100">
          <span className="font-semibold">From your journal.</span> Research and AI review stay
          private — trim the thesis for the community, confirm levels, then publish. No need to
          re-run Deepen+ or thesis coach here.
        </div>
      ) : fromJournal && !thesis.trim() ? (
        <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
          Prefilled from your private watchlist journal — add your thesis and levels below before
          publishing to the community.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {showFeedPreview ? (
            <PublishCallCardPreview
              user={user}
              symbol={symbol}
              assetClass={assetClass}
              direction={direction}
              thesis={thesis}
              entryPrice={liveEntryDisplay}
              targetPrice={targetPrice}
              stopPrice={stopPrice}
              timeframeTag={timeframeTag}
              lastPrice={marketPrice}
              publishFueled={isDeskIdentity}
              entryMode={entryMode}
              triggerEntryPrice={triggerEntryPrice}
              fromJournal={fromJournal}
              conviction={queryDraft.conviction}
              catalysts={queryDraft.catalysts}
              contextNotes={aiNotes}
              className="mb-0"
            />
          ) : (
            <div className="rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-5 text-sm text-[var(--pf-gray-600)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-500)]">
                Live feed preview
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                Enter a symbol and at least 10 characters of thesis to see how your call will look
                on the member feed.
              </p>
            </div>
          )}

          {showTradeSetup ? (
            <TradeSetupPreview
              direction={direction}
              entryPrice={liveEntryDisplay}
              targetPrice={targetPrice}
              stopPrice={stopPrice}
            />
          ) : null}

          {!journalPrefilled && !fromDiscovery ? (
            <ThesisCoachPanel
              isPro={isPro}
              showUpgrade={showUpgrade}
              draft={() => ({
                symbol,
                assetClass,
                direction,
                thesis,
                entryPrice: entryPrice ? parseFloat(entryPrice) : null,
                targetPrice: targetPrice ? parseFloat(targetPrice) : null,
                stopPrice: stopPrice ? parseFloat(stopPrice) : null,
                timeframeTag: timeframeTag || null,
              })}
            />
          ) : null}
        </aside>

        <div className="pf-workspace-panel p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {isAdmin ? (
              <>
                <PublishIdentitySwitcher />
                {isDeskIdentity ? (
                  <p className="rounded-lg border border-[var(--pf-red)]/25 bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-gray-800)]">
                    Publishing as <strong>PortFuel desk</strong> — this call will be{" "}
                    <strong>Fueled</strong>.
                  </p>
                ) : (
                  <p className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-sm text-[var(--pf-gray-700)]">
                    Publishing as your <strong>personal</strong> account — regular member call.
                  </p>
                )}
                <PublishXSourcePanel onApply={applyXPayload} />
              </>
            ) : null}

            {isAdmin || isPro ? (
              !journalPrefilled && !fromDiscovery ? (
              <section className="space-y-3 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="pf-eyebrow">AI assist</p>
                    <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
                      Generate a Fueled-style draft from just a ticker + notes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SegmentedControl
                      value={aiMode}
                      onChange={(v) => setAiMode(v as "default" | "deep")}
                      options={[
                        { value: "default", label: "Default" },
                        { value: "deep", label: "Deepen+" },
                      ]}
                    />
                    <span className="hidden text-xs text-[var(--pf-gray-500)] sm:inline">
                      Deepen+ pulls more context (news + web sources) for higher-quality drafts.
                    </span>
                    <Button
                      type="button"
                      onClick={generateAiDraft}
                      disabled={aiLoading || !symbol || publishBlocked}
                    >
                      {aiLoading ? "Generating…" : "Generate draft"}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="ai-notes">Notes (optional)</Label>
                  <Textarea
                    id="ai-notes"
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                    placeholder="What’s the setup? Any catalysts, levels mentioned elsewhere, angle you want the desk voice to hit…"
                    minLength={0}
                  />
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--pf-gray-500)]">
                    {aiCost != null ? (
                      <span>
                        Est. cost: <span className="font-mono">${aiCost.toFixed(4)}</span>
                      </span>
                    ) : null}
                    {aiCacheHit != null ? (
                      <span>
                        Cache: <span className="font-mono">{aiCacheHit ? "hit" : "miss"}</span>
                      </span>
                    ) : null}
                    {aiRemaining ? (
                      <span>
                        Remaining today:{" "}
                        <span className="font-mono">
                          {aiRemaining.default} default · {aiRemaining.deep} deep
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
                    How to use: enter a symbol, add notes (social post context helps), click Generate draft,
                    then review levels and thesis before publishing. Draft levels anchor to last price when
                    not stated in your notes.
                  </p>
                </div>
              </section>
              ) : null
            ) : null}

            <section className="space-y-4">
              <p className="pf-eyebrow">Setup</p>
              <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Asset type</Label>
                <SegmentedControl
                  value={assetClass}
                  onChange={setAssetClass}
                  options={[
                    { value: "equity", label: "Stock" },
                    { value: "crypto", label: "Crypto" },
                  ]}
                />
              </div>
              <div>
                <Label>Direction</Label>
                <SegmentedControl
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { value: "long", label: "Long" },
                    { value: "short", label: "Short" },
                  ]}
                />
              </div>
              </div>
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder={assetClass === "crypto" ? "BTC" : "AAPL"}
                  required
                  maxLength={12}
                  className={
                    symbolValid === true
                      ? "border-emerald-300 focus-visible:ring-emerald-500/30"
                      : symbolValid === false
                        ? "border-rose-300 focus-visible:ring-rose-500/30"
                        : undefined
                  }
                />
                {symbolValid && marketPrice != null ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--pf-gray-600)]">
                      Market{" "}
                      <span className="font-mono font-semibold tabular-nums text-[var(--pf-black)]">
                        ${formatPrice(marketPrice)}
                      </span>
                    </span>
                  </div>
                ) : null}
                {symbolHint ? (
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      symbolValid ? "pf-return-up" : "pf-return-down"
                    }`}
                  >
                    {symbolHint}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-[var(--pf-gray-400)]">
                    {assetClass === "crypto"
                      ? "Coinbase & Kraken majors only — no memecoins."
                      : "US equities supported via Finnhub."}
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <p className="pf-eyebrow">Thesis</p>
              <div>
                <Label htmlFor="thesis">Your call</Label>
                <Textarea
                  id="thesis"
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Why this trade? Catalysts, timeframe, risk management…"
                  required
                  minLength={10}
                />
                <p className="mt-1.5 text-xs text-[var(--pf-gray-400)]">
                  Minimum 10 characters · visible on dashboard and ticker page
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <p className="pf-eyebrow">Entry</p>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--pf-border)] px-3 py-2.5">
                  <input
                    type="radio"
                    name="entryMode"
                    checked={entryMode === "live"}
                    onChange={() => setEntryMode("live")}
                    className="mt-1 accent-[var(--pf-red)]"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-[var(--pf-gray-800)]">Live now</span>
                    <span className="mt-0.5 block text-xs text-[var(--pf-gray-500)]">
                      Entry locks to current price
                      {marketPrice != null ? ` ($${formatPrice(marketPrice)})` : ""} at publish.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--pf-border)] px-3 py-2.5">
                  <input
                    type="radio"
                    name="entryMode"
                    checked={entryMode === "conditional"}
                    onChange={() => setEntryMode("conditional")}
                    className="mt-1 accent-[var(--pf-red)]"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-[var(--pf-gray-800)]">Call a level</span>
                    <span className="mt-0.5 block text-xs text-[var(--pf-gray-500)]">
                      No return until price reaches your trigger (auto-expires in 30 days).
                    </span>
                  </span>
                </label>
                {entryMode === "conditional" ? (
                  <div>
                    <Label htmlFor="trigger">Trigger entry price</Label>
                    <Input
                      id="trigger"
                      type="number"
                      step="any"
                      required
                      value={triggerEntryPrice}
                      onChange={(e) => setTriggerEntryPrice(e.target.value)}
                      placeholder={direction === "long" ? "Below current price" : "Above current price"}
                      className="mt-1.5"
                    />
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              <p className="pf-eyebrow">Levels (optional)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="—"
                  />
                </div>
                <div>
                  <Label htmlFor="stop">Stop</Label>
                  <Input
                    id="stop"
                    type="number"
                    step="any"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    placeholder="—"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="timeframe">Timeframe tag</Label>
                <Input
                  id="timeframe"
                  value={timeframeTag}
                  onChange={(e) => setTimeframeTag(e.target.value)}
                  placeholder="e.g. Swing · 2–4 weeks"
                />
              </div>
            </section>

            {quotaBlocked ? (
              <p className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-sm text-[var(--pf-gray-600)]">
                Weekly call limit reached ({weeklyQuota.used}/{weeklyQuota.limit}).{" "}
                {showUpgrade
                  ? "Upgrade to Pro in billing for 6 calls/week."
                  : "Your quota resets on a rolling 7-day window."}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || symbolValid === false || publishBlocked || quotaBlocked}
            >
              {loading ? COPY.publishingCall : COPY.publishCall}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
