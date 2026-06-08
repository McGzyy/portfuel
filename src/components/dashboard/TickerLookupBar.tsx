"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";

export function TickerLookupBar({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [assetClass, setAssetClass] = useState<"equity" | "crypto">("equity");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);

  async function goToTicker(e?: React.FormEvent) {
    e?.preventDefault();
    const sym = symbol.trim().toUpperCase();
    if (sym.length < 1) return;

    setLoading(true);
    setHint("");
    try {
      const res = await fetch(
        `/api/symbols/validate?symbol=${encodeURIComponent(sym)}&assetClass=${assetClass}`
      );
      const data = await res.json();
      if (!data.ok) {
        setHint(
          data.error === "memecoin_blocked"
            ? "That symbol is not allowed on PortFuel."
            : "Symbol not found — try another ticker or switch asset type."
        );
        return;
      }
      router.push(`/ticker/${sym}`);
    } catch {
      setHint("Could not validate symbol. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={
        embedded
          ? ""
          : "pf-workspace-panel p-4"
      }
      aria-label="Look up any ticker"
    >
      {!embedded ? (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Look up ticker
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Open chart, community calls, and market intel for any symbol — not a fixed shortcut.
          </p>
        </>
      ) : null}
      <form onSubmit={goToTicker} className={embedded ? "space-y-3" : "mt-4 space-y-3"}>
        <SegmentedControl
          value={assetClass}
          onChange={setAssetClass}
          options={[
            { value: "equity", label: "Stock" },
            { value: "crypto", label: "Crypto" },
          ]}
        />
        <div className="flex gap-2">
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder={assetClass === "crypto" ? "e.g. BTC, ETH" : "e.g. AAPL, NVDA"}
            maxLength={12}
            className="font-mono"
            aria-label="Ticker symbol"
          />
          <Button type="submit" disabled={loading || symbol.trim().length < 1}>
            <Search className="h-4 w-4" strokeWidth={2.5} />
            {loading ? "…" : "Open"}
          </Button>
        </div>
        {hint ? (
          <p className="text-xs font-medium text-rose-600">{hint}</p>
        ) : null}
      </form>
    </section>
  );
}
