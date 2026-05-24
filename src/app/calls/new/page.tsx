"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewCallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAsset =
    searchParams.get("asset") === "crypto" ? "crypto" : "equity";

  const [assetClass, setAssetClass] = useState<"equity" | "crypto">(initialAsset);
  const [symbol, setSymbol] = useState("");
  const [symbolHint, setSymbolHint] = useState("");
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
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/symbols/validate?symbol=${encodeURIComponent(symbol)}&assetClass=${assetClass}`
      );
      const data = await res.json();
      if (data.ok) {
        setSymbolHint(data.name ? `✓ ${data.name}` : "✓ Valid");
      } else {
        setSymbolHint(data.error ?? "");
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
          setError(`Weekly limit reached (${data.quota} calls). Build your track record to unlock more.`);
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
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]">
          ← Dashboard
        </Link>
        <Card className="mt-4">
          <CardHeader>
            <h1 className="text-xl font-bold">Submit a call</h1>
            <p className="text-sm text-[var(--pf-gray-500)]">
              Stocks: news, earnings, and filings on the ticker page. Crypto: Coinbase/Kraken
              majors only — no memecoins.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Asset type</label>
                <select
                  className="flex h-10 w-full rounded-lg border border-[var(--pf-border)] px-3 text-sm"
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as "equity" | "crypto")}
                >
                  <option value="equity">Stock (equity)</option>
                  <option value="crypto">Crypto (major exchanges)</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Symbol</label>
                  <Input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder={assetClass === "crypto" ? "BTC" : "AAPL"}
                    required
                    maxLength={12}
                  />
                  {symbolHint ? (
                    <p
                      className={`mt-1 text-xs ${symbolHint.startsWith("✓") ? "text-emerald-600" : "text-[var(--pf-gray-500)]"}`}
                    >
                      {symbolHint}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Direction</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-[var(--pf-border)] px-3 text-sm"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as "long" | "short")}
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Thesis</label>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-red)]"
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Why this trade? Catalysts, timeframe, risk…"
                  required
                  minLength={10}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Entry (optional)</label>
                  <Input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Target (optional)</label>
                  <Input
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stop (optional)</label>
                  <Input
                    type="number"
                    step="any"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Timeframe tag (optional)</label>
                <Input
                  value={timeframeTag}
                  onChange={(e) => setTimeframeTag(e.target.value)}
                  placeholder="e.g. Swing · 2-4 weeks"
                />
              </div>
              {error ? <p className="text-sm text-[var(--pf-red)]">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting…" : "Publish call"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
