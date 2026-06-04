import Link from "next/link";
import { Bell } from "lucide-react";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { WATCHLIST_MOVE_ALERT_PCT } from "@/lib/watchlist/service";
import { formatPct } from "@/lib/utils";

export function WatchlistMoveAlerts({
  items,
  proUnlocked,
}: {
  items: WatchlistEntry[];
  proUnlocked: boolean;
}) {
  const alerts = items.filter(
    (i) =>
      i.change_since_add_pct != null &&
      Math.abs(i.change_since_add_pct) >= WATCHLIST_MOVE_ALERT_PCT
  );

  if (alerts.length === 0) return null;

  if (!proUnlocked) {
    return (
      <div className="rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-xs text-[var(--pf-gray-600)]">
        <span className="font-semibold text-[var(--pf-black)]">{alerts.length} symbol(s)</span> moved
        ±{WATCHLIST_MOVE_ALERT_PCT}%+ since you added them.{" "}
        <Link href="/settings" className="font-semibold text-[var(--pf-red)] hover:underline">
          Pro Intelligence
        </Link>{" "}
        unlocks move alerts on your watchlist.
      </div>
    );
  }

  return (
    <div className="rounded-[var(--pf-radius-lg)] border border-amber-200/80 bg-amber-50/90 px-4 py-3">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
        <Bell className="h-3.5 w-3.5" strokeWidth={2.25} />
        Watchlist alerts
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {alerts.map((i) => (
          <li key={i.symbol}>
            <Link
              href={`/ticker/${i.symbol}`}
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
