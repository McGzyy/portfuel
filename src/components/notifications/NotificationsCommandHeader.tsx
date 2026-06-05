import Link from "next/link";

export function NotificationsCommandHeader({
  unreadCount,
  totalCount,
  embedded = false,
}: {
  unreadCount: number;
  totalCount: number;
  embedded?: boolean;
}) {
  const content = (
    <div className="max-w-2xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        Activity · Notifications
      </p>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
        Notifications
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
        {totalCount} total
        {unreadCount > 0 ? (
          <span className="font-semibold text-[var(--pf-red)]">
            {" "}
            · {unreadCount} unread
          </span>
        ) : (
          <span className="text-[var(--pf-gray-400)]"> · all caught up</span>
        )}
        {" "}
        — watchlist alerts, calls, votes, comments, desk updates, and DMs.{" "}
        <Link href="/settings#alerts" className="font-semibold text-[var(--pf-red)] hover:underline">
          Alert settings
        </Link>
      </p>
      <Link
        href="/dashboard"
        className="mt-3 inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
      >
        ← Workspace overview
      </Link>
    </div>
  );

  if (embedded) return content;

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      {content}
    </header>
  );
}
