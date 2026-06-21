"use client";

import Link from "next/link";
import { useWorkspaceActivityOptional } from "@/components/workspace/WorkspaceActivityProvider";
import { cn } from "@/lib/utils";

export function OverviewRailLiveCounts({
  dmUnread: initialDm,
  notifUnread: initialNotif,
  feedNewCount: initialFeed,
}: {
  dmUnread: number;
  notifUnread: number;
  feedNewCount: number;
}) {
  const activity = useWorkspaceActivityOptional();
  const dm = activity?.dmUnread ?? initialDm;
  const notif = activity?.notifUnread ?? initialNotif;
  const feed = activity?.feedNewCount ?? initialFeed;

  const items = [
    { href: "/dashboard/feed", label: "Member feed", count: feed },
    { href: "/dashboard/messages", label: "Messages", count: dm },
    { href: "/dashboard/notifications", label: "Alerts", count: notif },
  ];

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--pf-black)]"
          >
            <span>{item.label}</span>
            {item.count > 0 ? (
              <span className="rounded-full bg-[var(--pf-red-muted)] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[var(--pf-red)]">
                {item.count > 99 ? "99+" : item.count}
              </span>
            ) : (
              <span className="text-[10px] text-[var(--pf-gray-400)]">—</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OverviewRailStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-lg font-bold tabular-nums",
          accent === "positive" && "text-emerald-600",
          accent === "negative" && "text-[var(--pf-red)]",
          !accent && "text-[var(--pf-black)]"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-[var(--pf-gray-500)]">{hint}</p> : null}
    </div>
  );
}
