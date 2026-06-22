import Link from "next/link";
import { Bell, Settings2, Star } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";

export function AlertsContextRail({
  unreadCount,
  totalCount,
}: {
  unreadCount?: number;
  totalCount?: number;
}) {
  return (
    <ContextRailModule eyebrow="Inbox" title="Alerts pulse" ariaLabel="Alerts context">
      <ContextRailBlock title="Inbox">
        <div className="grid grid-cols-2 gap-2">
          <OverviewRailMiniStat
            label="Unread"
            value={unreadCount != null ? String(unreadCount) : "—"}
            accent={unreadCount != null && unreadCount > 0 ? "positive" : undefined}
          />
          <OverviewRailMiniStat label="Total" value={totalCount != null ? String(totalCount) : "—"} />
        </div>
      </ContextRailBlock>

      <ContextRailBlock title="Go">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/dashboard/settings?section=notifications"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Settings2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Alert settings
          </Link>
          <Link
            href="/dashboard/watchlist"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Star className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Watchlist
          </Link>
          <Link
            href="/dashboard/feed"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Bell className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Community feed
          </Link>
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
