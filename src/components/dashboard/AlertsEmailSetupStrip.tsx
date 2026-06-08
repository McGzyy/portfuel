import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

/** Nudge members with a watchlist to turn on instant email alerts. */
export function AlertsEmailSetupStrip({
  watchlistCount,
  emailInstantEnabled,
  notifyEmail,
  emailVerified,
}: {
  watchlistCount: number;
  emailInstantEnabled: boolean;
  notifyEmail: string | null;
  emailVerified: boolean;
}) {
  if (watchlistCount === 0) return null;
  if (emailInstantEnabled && notifyEmail?.trim()) return null;

  const detail = !emailVerified
    ? "Verify your email, then enable instant alerts so watchlist moves reach your inbox."
    : !notifyEmail?.trim()
      ? "Add a notification email to receive watchlist price, earnings, and call alerts."
      : "Instant email alerts are off — enable them to get watchlist movers outside the app.";

  return (
    <Link
      href="/dashboard/settings?section=notifications"
      className="pf-alerts-setup-strip group block rounded-[var(--pf-radius-lg)] border px-4 py-3.5 shadow-[var(--pf-shadow-sm)] transition-colors sm:px-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            <Bell className="h-3.5 w-3.5 text-[var(--pf-red)]" strokeWidth={2.25} />
            Watchlist alerts
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            Turn on email delivery for your watchlist
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-500)]">{detail}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 pt-1 text-xs font-semibold text-[var(--pf-red)] group-hover:underline">
          Settings
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}
