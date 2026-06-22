import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export function NotificationsCommandHeader({
  unreadCount,
  totalCount,
  action,
}: {
  unreadCount: number;
  totalCount: number;
  action?: React.ReactNode;
}) {
  return (
    <WorkspacePageHeader
      eyebrow="Activity · Alerts"
      title="Alerts"
      description={
        <>
          {totalCount} total
          {unreadCount > 0 ? (
            <span className="font-semibold text-[var(--pf-red)]">
              {" "}
              · {unreadCount} unread
            </span>
          ) : (
            <span className="text-[var(--pf-gray-400)]"> · all caught up</span>
          )}{" "}
          — watchlist alerts, social engagement, support, billing, desk updates, and DMs.
        </>
      }
      action={action}
      footerLink={
        <Link
          href="/dashboard"
          className="inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
        >
          ← Workspace overview
        </Link>
      }
    />
  );
}
