import Link from "next/link";
import { Bell } from "lucide-react";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { WATCHLIST_MOVE_ALERT_PCT } from "@/lib/watchlist/service";
import { formatPct } from "@/lib/utils";

export function WatchlistMoveAlerts({
  items,
  proUnlocked = false,
}: {
  items: WatchlistEntry[];
  proUnlocked?: boolean;
}) {
  const alerts = items.filter(
    (i) =>
      i.change_since_add_pct != null &&
      Math.abs(i.change_since_add_pct) >= WATCHLIST_MOVE_ALERT_PCT
  );

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
            · SMS available on Pro
          </span>
        ) : null}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {alerts.map((i) => (
          <li key={i.symbol}>
            <Link
              href={`/dashboard/watchlist/${i.symbol}`}
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
