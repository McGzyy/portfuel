import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CallCard } from "@/components/calls/CallCard";
import { MemberReturnChart } from "@/components/charts/MemberReturnChart";
import { MemberProfileHero } from "@/components/member/MemberProfileHero";
import { MemberTrackRecordStrip } from "@/components/member/MemberTrackRecordStrip";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import {
  WorkspacePageHeader,
  WorkspaceHeaderAction,
} from "@/components/dashboard/WorkspacePageHeader";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { ProfileBillingSection } from "@/components/billing/ProfileBillingSection";
import { ProfileBillingSync } from "@/app/profile/BillingSync";
import { isDemoMode } from "@/lib/demo/config";

export const metadata: Metadata = {
  title: "Your profile",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!isDemoMode() && !hasSupabaseConfig()) {
    redirect("/dashboard");
  }

  const profile = await fetchOwnProfile(session);
  const { member, calls } = profile;

  if (!member) {
    redirect("/dashboard");
  }

  const trackRecord = summarizeMemberTrackRecord(calls);
  const returnSeries = buildCumulativeReturnSeries(calls);

  return (
    <AppShell user={toHeaderUser(session)}>
      <ProfileBillingSync />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WorkspaceBackLink />
        <Link
          href={`/member/${member.username}`}
          className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
        >
          Public profile →
        </Link>
      </div>

      <div className="mt-6">
        <MemberProfileHero member={member} isSelf />
      </div>

      <div className="mt-6">
        <ProfileBillingSection
          subscriptionStatus={profile.subscriptionStatus}
          membershipTier={profile.membershipTier}
          stripeCustomerId={profile.stripeCustomerId}
        />
      </div>

      <div className="mt-6">
        <MemberReturnChart points={returnSeries} />
      </div>

      <div className="mt-6">
        <MemberTrackRecordStrip record={trackRecord} />
      </div>

      <section className="mt-10">
        <WorkspacePageHeader
          eyebrow="Your book"
          title="Published calls"
          description="Your public track record — every thesis you've published on PortFuel."
          action={<WorkspaceHeaderAction href="/calls/new" label="New call" />}
          className="mb-6"
        />

        {calls.length === 0 ? (
          <div className="pf-workspace-panel px-6 py-14 text-center text-sm text-[var(--pf-gray-500)]">
            No calls yet. Submit your first thesis from the workspace.
          </div>
        ) : (
          <ul className="space-y-4">
            {calls.map((c) => (
              <li key={c.id}>
                <CallCard
                  call={{
                    id: c.id,
                    symbol: c.symbol,
                    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
                    direction: c.direction,
                    thesis: c.thesis,
                    called_at: c.called_at,
                    return_pct: c.return_pct,
                    target_progress: c.target_progress,
                    entry_price: c.entry_price,
                    target_price: c.target_price,
                    stop_price: c.stop_price,
                    last_price: c.last_price,
                    timeframe_tag: c.timeframe_tag,
                    is_fueled: c.is_fueled,
                    vote_score: c.vote_score,
                    comment_count: c.comment_count,
                    display_name: member.display_name,
                    pin: member.username,
                    username: member.username,
                    is_trusted: member.trusted,
                  }}
                  interactive
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
