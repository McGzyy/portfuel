import Link from "next/link";
import { Bell } from "lucide-react";
import { resolvePriceMoveThreshold } from "@/lib/alerts/price-threshold";
import type { WatchlistAlertPrefs } from "@/lib/alerts/preferences";
import { journalAlertHref } from "@/lib/journal/paths";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { formatPct } from "@/lib/utils";

export function WatchlistMoveAlerts({
  items,
  proUnlocked = false,
  globalPrefs,
}: {
  items: WatchlistEntry[];
  proUnlocked?: boolean;
  globalPrefs: WatchlistAlertPrefs;
}) {
  if (!globalPrefs.price_move) return null;

  const alerts = items.filter((i) => {
    if (i.change_since_add_pct == null) return false;
    const threshold = resolvePriceMoveThreshold(globalPrefs, {
      symbolPriceAlertPct: i.price_alert_pct,
      proUnlocked,
    });
    return threshold != null && Math.abs(i.change_since_add_pct) >= threshold;
  });

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-[var(--pf-radius-lg)] border border-amber-200/80 bg-amber-50/90 px-4 py-3">
      <p className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
        <span className="inline-flex items-center gap-2">
          <Bell className="h-3.5 w-3.5" strokeWidth={2.25} />
          Watchlist movers
        </span>
        <Link
          href="/settings#alerts"
          className="normal-case tracking-normal text-amber-800 underline-offset-2 hover:underline"
        >
          Alert settings
        </Link>
        {proUnlocked ? (
          <span className="normal-case tracking-normal font-normal text-amber-800/80">
            · Per-symbol thresholds on Pro
          </span>
        ) : null}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {alerts.map((i) => (
          <li key={i.symbol}>
            <Link
              href={journalAlertHref(i.symbol, "price_move")}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-white px-2.5 py-1 text-xs font-semibold text-amber-950 hover:border-amber-400"
            >
              <span className="font-mono">{i.symbol}</span>
              <span
                className={
                  (i.change_since_add_pct ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"
                }
              >
                {(i.change_since_add_pct ?? 0) >= 0 ? "+" : ""}
                {formatPct(i.change_since_add_pct)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
