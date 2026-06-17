"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { watchlistAddErrorMessage } from "@/lib/watchlist/add-errors";
import type { AssetClass } from "@/lib/market/validate-symbol";
import { cn } from "@/lib/utils";

export function AddToWatchlistButton({
  symbol,
  assetClass,
  className,
  size = "sm",
}: {
  symbol: string;
  assetClass?: AssetClass;
  className?: string;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const sym = symbol.toUpperCase();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(watchlistAddErrorMessage(data.error));
        return;
      }
      router.refresh();
    } catch {
      setError("Could not add to watchlist.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      <Button
        type="button"
        size={size}
        variant="outline"
        className="gap-1.5 border-[var(--pf-border)] bg-[var(--pf-surface)]"
        disabled={adding}
        onClick={() => void add()}
      >
        {adding ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Star className="h-4 w-4" aria-hidden />
        )}
        {adding ? "Adding…" : "Add to watchlist"}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {assetClass ? (
        <p className="sr-only">Asset class: {assetClass}</p>
      ) : null}
    </div>
  );
}
