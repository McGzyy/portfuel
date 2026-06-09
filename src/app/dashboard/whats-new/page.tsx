import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { WhatsNewTimeline } from "@/components/announcements/WhatsNewTimeline";
import { requireDashboardSession } from "@/lib/dashboard/data";
import {
  countUnreadWhatsNew,
  fetchChangelogForUser,
} from "@/lib/announcements/changelog";

export const metadata: Metadata = {
  title: "What's new",
};

export default async function WhatsNewPage() {
  const session = await requireDashboardSession();
  const entries = await fetchChangelogForUser(session.userId, session).catch(() => []);
  const unread = countUnreadWhatsNew(entries);

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
            <Sparkles className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Product
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              What&apos;s new
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
              Release notes and workspace updates.
              {unread > 0 ? (
                <span className="font-semibold text-[var(--pf-red)]">
                  {" "}
                  {unread} unread.
                </span>
              ) : (
                " You're caught up."
              )}
            </p>
          </div>
        </div>
      </header>

      <WhatsNewTimeline initialEntries={entries} />

      <p className="text-center text-xs text-[var(--pf-gray-500)]">
        Questions?{" "}
        <Link href="/dashboard/help" className="font-semibold text-[var(--pf-red)] hover:underline">
          Help center
        </Link>
      </p>
    </div>
  );
}
