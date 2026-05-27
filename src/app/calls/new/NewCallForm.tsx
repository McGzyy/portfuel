"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Card, CardContent } from "@/components/ui/card";
import { TradeSetupPreview } from "@/components/calls/TradeSetupPreview";
import { ThesisCoachPanel } from "@/components/ai/ThesisCoachPanel";
import { MemberQuotaStrip } from "@/components/member/MemberQuotaStrip";
import type { HeaderUser } from "@/lib/auth/session-user";
import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";

export function NewCallForm({
  user,
  weeklyQuota,
  showUpgrade,
  isPro,
}: {
  user: HeaderUser;
  weeklyQuota: WeeklyQuotaStatus;
  showUpgrade?: boolean;
  isPro: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAsset =
    searchParams.get("asset") === "crypto" ? "crypto" : "equity";
  const initialSymbol = (searchParams.get("symbol") ?? "").toUpperCase();

  const [assetClass, setAssetClass] = useState<"equity" | "crypto">(initialAsset);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [symbolHint, setSymbolHint] = useState("");
  const [symbolValid, setSymbolValid] = useState<boolean | null>(null);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [thesis, setThesis] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [timeframeTag, setTimeframeTag] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "quota_exceeded") {
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
      router.push(`/ticker/${data.call.symbol}`);
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

      <PageHeader
        title="Submit a call"
        description="Share your thesis with members. Stocks get news and filings on the ticker page; crypto must be on major exchanges."
        className="border-none pb-4"
      />

      <MemberQuotaStrip quota={weeklyQuota} showUpgrade={showUpgrade} className="mb-6" />

      <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
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
              disabled={loading || symbolValid === false}
            >
              {loading ? "Publishing…" : "Publish call"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
