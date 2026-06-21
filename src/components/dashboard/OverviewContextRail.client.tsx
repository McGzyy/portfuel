"use client";

import Link from "next/link";
import { useWorkspaceActivityOptional } from "@/components/workspace/WorkspaceActivityProvider";
import { cn } from "@/lib/utils";

export function OverviewRailInboxStrip({
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
    { href: "/dashboard/feed", label: "Feed", count: feed },
    { href: "/dashboard/messages", label: "DMs", count: dm },
    { href: "/dashboard/notifications", label: "Alerts", count: notif },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-1.5 py-2 text-center hover:border-[var(--pf-gray-300)] hover:bg-white"
        >
          <span className="text-[10px] font-semibold text-[var(--pf-gray-600)]">{item.label}</span>
          <span
            className={cn(
              "mt-1 text-sm font-bold tabular-nums",
              item.count > 0 ? "text-[var(--pf-red)]" : "text-[var(--pf-gray-400)]"
            )}
          >
            {item.count > 99 ? "99+" : item.count}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function OverviewRailMiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2 py-2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-bold tabular-nums leading-tight",
          accent === "positive" && "text-emerald-600",
          accent === "negative" && "text-[var(--pf-red)]",
          !accent && "text-[var(--pf-black)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
