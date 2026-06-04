"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { NewCallPageHeader } from "@/components/calls/NewCallPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Card, CardContent } from "@/components/ui/card";
import { TradeSetupPreview } from "@/components/calls/TradeSetupPreview";
import { ThesisCoachPanel } from "@/components/ai/ThesisCoachPanel";
import { MemberQuotaStrip } from "@/components/member/MemberQuotaStrip";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import type { SessionPayload } from "@/lib/auth/session-types";
import type { HeaderUser } from "@/lib/auth/session-user";
import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import type { TickerAnalyzeResult } from "@/lib/ai/ticker-analyze";
import { formatFueledThesisForPublish } from "@/lib/ai/fueled-analysis-format";
import { COPY } from "@/lib/copy";
import { formatPrice } from "@/lib/utils";

function readPublishQuery(sp: URLSearchParams) {
  const directionParam = sp.get("direction");
  return {
    fromTweet: sp.get("from") === "tweet",
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
  };
}

export function NewCallForm({
  user,
  weeklyQuota,
  showUpgrade,
  isPro,
  isAdmin = false,
  role,
  canPublishCalls,
  canDm,
  canComment,
}: {
  user: HeaderUser;
  weeklyQuota: WeeklyQuotaStatus;
  showUpgrade?: boolean;
  isPro: boolean;
  isAdmin?: boolean;
  role: SessionPayload["role"];
  canPublishCalls: boolean;
  canDm: boolean;
  canComment: boolean;
}) {
  const publishBlocked = role !== "admin" && !canPublishCalls;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDraft = readPublishQuery(searchParams);
  const initialAsset =
    searchParams.get("asset") === "crypto" ? "crypto" : "equity";
  const initialSymbol = (searchParams.get("symbol") ?? "").toUpperCase();

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
  const [sourceTweetUrl] = useState(queryDraft.sourceTweetUrl);
  const [publishFueled, setPublishFueled] = useState(
    isAdmin && queryDraft.publishFueled
  );
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

      if (isAdmin) setPublishFueled(true);
      setThesis(formatFueledThesisForPublish(analysis));
      if (analysis.direction) setDirection(analysis.direction);
      if (analysis.entryPrice != null) setEntryPrice(String(analysis.entryPrice));
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
      } else {
        setSymbolValid(false);
        setSymbolHint(data.error ?? "Invalid symbol");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [symbol, assetClass]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fueled = isAdmin && publishFueled;
      const modeToSend: "default" | "deep" | undefined = fueled
        ? sourceTweetUrl
          ? queryDraft.socialMode === "deep"
            ? "deep"
            : "default"
          : aiMode
        : undefined;
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          assetClass,
          direction,
          thesis,
          entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
          targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
          stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
          timeframeTag: timeframeTag || undefined,
          isFueled: fueled ? true : undefined,
          sourceTweetUrl: isAdmin && sourceTweetUrl ? sourceTweetUrl : undefined,
          socialAnalysisMode: modeToSend,
          socialAnalysisRawText:
            fueled && !sourceTweetUrl && aiDraftRawText ? aiDraftRawText : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "publish_restricted") {
          setError("Your account cannot publish new calls right now.");
        } else if (data.error === "quota_exceeded") {
          setError(
            showUpgrade
              ? `Weekly limit reached (${data.quota} calls this week). Upgrade to Pro on your profile for 6 calls/week.`
              : `Weekly limit reached (${data.quota} calls this week). Your quota resets on a rolling 7-day window.`
          );
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

  return (
    <AppShell user={user} width="narrow">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-red)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to dashboard
      </Link>

      <NewCallPageHeader
        weeklyQuota={weeklyQuota}
        fueledMode={publishFueled}
        prefilledSymbol={symbol.trim() || undefined}
      />

      <ModerationBanner
        role={role}
        canPublishCalls={canPublishCalls}
        canDm={canDm}
        canComment={canComment}
        className="mb-4 rounded-lg border border-amber-200/80"
      />

      <MemberQuotaStrip quota={weeklyQuota} showUpgrade={showUpgrade} className="mb-6" />

      {queryDraft.fromTweet ? (
        <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Prefilled from a social draft — confirm symbol, levels, and thesis before publishing.
        </div>
      ) : null}

      <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {isAdmin || isPro ? (
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
            ) : null}

            <section className="space-y-4">
              <p className="pf-eyebrow">Setup</p>
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
              {isAdmin ? (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={publishFueled}
                    onChange={(e) => setPublishFueled(e.target.checked)}
                    className="h-4 w-4 accent-[var(--pf-red)]"
                  />
                  <span className="font-medium text-[var(--pf-gray-800)]">
                    Publish as Fueled desk call
                  </span>
                </label>
              ) : null}
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
                    <button
                      type="button"
                      className="rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
                      onClick={() => setEntryPrice(String(marketPrice))}
                    >
                      Use as entry
                    </button>
                  </div>
                ) : null}
                {symbolHint ? (
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      symbolValid ? "text-emerald-600" : "text-rose-600"
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
              <p className="pf-eyebrow">Levels (optional)</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="entry">Entry</Label>
                  <Input
                    id="entry"
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="—"
                  />
                </div>
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
              <TradeSetupPreview
                direction={direction}
                entryPrice={entryPrice}
                targetPrice={targetPrice}
                stopPrice={stopPrice}
              />
            </section>

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

            {error ? (
              <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || symbolValid === false || publishBlocked}
            >
              {loading ? COPY.publishingCall : COPY.publishCall}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
