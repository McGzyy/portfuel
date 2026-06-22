import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export function NotificationsCommandHeader({
  unreadCount,
  totalCount,
  embedded = false,
}: {
  unreadCount: number;
  totalCount: number;
  embedded?: boolean;
}) {
  const description = (
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
  );

  if (embedded) {
    return (
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Activity · Alerts
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
          Alerts
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{description}</p>
      </div>
    );
  }

  return (
    <WorkspacePageHeader
      eyebrow="Activity · Alerts"
      title="Alerts"
      description={description}
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
