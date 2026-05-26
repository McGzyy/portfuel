"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeskPortfolioWatchlistButton({ openCount }: { openCount: number }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (openCount === 0) return null;

  async function addAll() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/desk/portfolio/add-to-watchlist", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "demo_readonly"
            ? "Demo mode is read-only."
            : data.error === "subscription_inactive"
              ? "Active membership required."
              : "Could not update watchlist."
        );
        return;
      }
      const parts: string[] = [];
      if (data.added > 0) parts.push(`Added ${data.added} symbol${data.added === 1 ? "" : "s"}`);
      if (data.alreadyOnList > 0) {
        parts.push(`${data.alreadyOnList} already on your watchlist`);
      }
      if (data.watchlistFull) parts.push("Watchlist is full — add room or remove symbols");
      setMessage(parts.length > 0 ? parts.join(". ") + "." : "All open portfolio symbols are on your watchlist.");
    } catch {
      setError("Could not update watchlist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 px-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => void addAll()}
        className="gap-1.5"
      >
        <Star className="h-3.5 w-3.5" />
        {loading ? "Adding…" : "Add open portfolio to watchlist"}
      </Button>
      {message ? <span className="text-xs text-emerald-700">{message}</span> : null}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
