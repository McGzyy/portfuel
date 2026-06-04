"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Loader2 } from "lucide-react";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";

type EarningsEvent = {
  symbol: string;
  date: string;
  hour: string;
  epsEstimate: number | null;
};

function formatEarningsDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function hourLabel(hour: string) {
  const h = hour?.toLowerCase() ?? "";
  if (h === "bmo" || h === "amc") return h.toUpperCase();
  if (h.includes("before")) return "BMO";
  if (h.includes("after")) return "AMC";
  return hour || "—";
}

export function EarningsCalendarPanel({
  locked,
  proGateCta,
}: {
  locked: boolean;
  proGateCta: ProGateCta;
}) {
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(!locked);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (locked) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pro/earnings-calendar");
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "pro_required"
            ? "Pro Intelligence required."
            : "Could not load earnings calendar."
        );
        return;
      }
      setEvents(data.events ?? []);
    } catch {
      setError("Could not load earnings calendar.");
    } finally {
      setLoading(false);
    }
  }, [locked]);

  useEffect(() => {
    load();
  }, [load]);

  const body = (
    <div className="pf-workspace-panel p-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[var(--pf-red)]" strokeWidth={2.25} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Earnings calendar · next 14 days
        </p>
      </div>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        Upcoming reports for symbols on your watchlist (equity only).{" "}
        <Link href="/dashboard/earnings" className="font-semibold text-[var(--pf-red)] hover:underline">
          Earnings battleboard →
        </Link>
      </p>

      {loading ? (
        <div className="mt-6 flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--pf-red)]" />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-600">{error}</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">
          No earnings dates in range for your watchlist. Add equity tickers like AAPL or NVDA.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--pf-border)]">
          {events.map((ev) => (
            <li key={`${ev.symbol}-${ev.date}`} className="flex items-center justify-between py-3">
              <div>
                <Link
                  href={`/ticker/${ev.symbol}`}
                  className="font-mono text-sm font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                >
                  {ev.symbol}
                </Link>
                <p className="text-xs text-[var(--pf-gray-500)]">
                  {formatEarningsDate(ev.date)} · {hourLabel(ev.hour)}
                  {ev.epsEstimate != null ? ` · EPS est ${ev.epsEstimate}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <ProIntelligenceGate
      locked={locked}
      cta={proGateCta}
      title="Pro earnings calendar"
      description="See upcoming earnings for every symbol on your watchlist — plan around community calls."
      compact
    >
      {body}
    </ProIntelligenceGate>
  );
}
