import Link from "next/link";
import { Inbox, Users } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";

export function MessagesContextRail({
  threadCount,
  unreadCount,
}: {
  threadCount?: number;
  unreadCount?: number;
}) {
  return (
    <ContextRailModule eyebrow="Social" title="Messages pulse" ariaLabel="Messages context">
      <ContextRailBlock title="Inbox">
        <div className="grid grid-cols-2 gap-2">
          <OverviewRailMiniStat label="Threads" value={threadCount != null ? String(threadCount) : "—"} />
          <OverviewRailMiniStat
            label="Unread"
            value={unreadCount != null ? String(unreadCount) : "—"}
            accent={unreadCount != null && unreadCount > 0 ? "positive" : undefined}
          />
        </div>
      </ContextRailBlock>

      <ContextRailBlock title="Go">
        <Link
          href="/dashboard/feed"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
        >
          <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Member feed
        </Link>
        <Link
          href="/rankings"
          className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
        >
          <Inbox className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Find members
        </Link>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
