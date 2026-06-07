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
      if (data.warning === "watchlist_unavailable") {
        setError("Could not load your watchlist symbols. Refresh the page or try again.");
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
    <div className="pf-workspace-panel flex h-full flex-col p-5">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[var(--pf-red)]" strokeWidth={2.25} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Watchlist earnings calendar · next 14 days
        </p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
        <strong className="font-semibold text-[var(--pf-gray-700)]">Your symbols only</strong> —
        report dates from the same market calendar as Earnings, filtered to equities on your
        watchlist. No member or desk positioning here.
      </p>
      <p className="mt-1.5 text-xs text-[var(--pf-gray-500)]">
        Want market-wide positioning before reports?{" "}
        <Link href="/dashboard/research?tab=earnings" className="font-semibold text-[var(--pf-red)] hover:underline">
          Open Earnings →
        </Link>
        {" · "}
        <Link href="/dashboard/settings?section=notifications" className="font-semibold text-[var(--pf-red)] hover:underline">
          Earnings alert prefs
        </Link>
      </p>

      {loading ? (
        <div className="mt-6 flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--pf-red)]" />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-600">{error}</p>
      ) : events.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-4 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
            <Calendar className="h-5 w-5 text-[var(--pf-gray-300)]" strokeWidth={2} />
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--pf-gray-700)]">
            No reports in the next 14 days
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--pf-gray-500)]">
            Your watchlist equities will appear here when Finnhub has upcoming earnings dates. Crypto
            symbols are excluded.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex-1 divide-y divide-[var(--pf-border)] overflow-hidden rounded-xl border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/40">
          {events.map((ev) => (
            <li key={`${ev.symbol}-${ev.date}`} className="flex items-center justify-between bg-white px-4 py-3 first:rounded-t-xl last:rounded-b-xl">
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
      title="Watchlist earnings calendar"
      description="Upcoming report dates for symbols you track. For community lean and desk direction, open Earnings."
      compact
      className="h-full"
    >
      {body}
    </ProIntelligenceGate>
  );
}
