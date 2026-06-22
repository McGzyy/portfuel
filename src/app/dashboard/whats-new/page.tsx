import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { WhatsNewTimeline } from "@/components/announcements/WhatsNewTimeline";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
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
      <WorkspacePageHeader
        eyebrow="Product"
        title="What's new"
        titleAddon={
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
        }
        description={
          <>
            Release notes and workspace updates.
            {unread > 0 ? (
              <span className="font-semibold text-[var(--pf-red)]"> {unread} unread.</span>
            ) : (
              " You're caught up."
            )}
          </>
        }
      />

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
