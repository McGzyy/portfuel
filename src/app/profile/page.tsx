import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CallCard } from "@/components/calls/CallCard";
import { MemberProfileHero } from "@/components/member/MemberProfileHero";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import {
  WorkspacePageHeader,
  WorkspaceNewCallAction,
} from "@/components/dashboard/WorkspacePageHeader";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { ProfileBillingSection } from "@/components/billing/ProfileBillingSection";
import { ProfileEmailSection } from "@/components/profile/ProfileEmailSection";
import { ProfileReferralSection } from "@/components/profile/ProfileReferralSection";
import { ProfileSocialHighlightSection } from "@/components/profile/ProfileSocialHighlightSection";
import { ProfileVouchersSection } from "@/components/profile/ProfileVouchersSection";
import { ProfileDiscordSection } from "@/components/profile/ProfileDiscordSection";
import { ProfilePageNav } from "@/components/profile/ProfilePageNav";
import { ProfilePerformanceSection } from "@/components/profile/ProfilePerformanceSection";
import { ProfileSettingsGroup } from "@/components/profile/ProfileSettingsGroup";
import { fetchAiCoachUsage } from "@/lib/ai/usage";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { ProfileBillingSync } from "@/app/profile/BillingSync";
import { isDemoMode } from "@/lib/demo/config";
import { buildReturnDistribution } from "@/lib/charts/return-distribution";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

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

  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const trackRecord = summarizeMemberTrackRecord(calls);
  const returnSeries = buildCumulativeReturnSeries(calls);
  const returnBuckets = buildReturnDistribution(calls);
  const aiUsage = await fetchAiCoachUsage({
    userId: session.userId,
    membershipTier: session.membershipTier ?? null,
    role: session.role,
    configured: isAiCoachConfigured(),
  });

  const membershipOpen =
    profile.subscriptionStatus !== "active" || profile.membershipTier !== "pro";

  return (
    <AppShell user={toHeaderUser(session)}>
      <ProfileBillingSync />
      <div className="mx-auto max-w-4xl space-y-6">
        <ModerationBanner
          role={session.role}
          canPublishCalls={session.canPublishCalls}
          canDm={session.canDm}
          canComment={session.canComment}
          className="rounded-lg border border-amber-200/80"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <WorkspaceBackLink />
          <Link
            href={`/member/${member.username}`}
            className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
          >
            Public profile →
          </Link>
        </div>

        <MemberProfileHero member={member} isSelf />

        <WorkspaceQuickActions compact />

        <ProfilePageNav />

        <ProfilePerformanceSection
          trackRecord={trackRecord}
          returnSeries={returnSeries}
          returnBuckets={returnBuckets}
          proLocked={proLocked}
          proGateCta={proGateCta}
          aiUsage={aiUsage}
        />

        <section id="calls" className="scroll-mt-24">
          <WorkspacePageHeader
            eyebrow="Your book"
            title="Published calls"
            description="Manage, delete, or publish new theses — each call updates your public track record."
            action={<WorkspaceNewCallAction />}
            className="mb-6"
          />

          {calls.length === 0 ? (
            <div className="pf-workspace-panel px-6 py-14 text-center text-sm text-[var(--pf-gray-500)]">
              No calls yet. Publish your first thesis from the workspace.
            </div>
          ) : (
            <ul className="space-y-4">
              {calls.map((c) => (
                <li key={c.id}>
                  <CallCard
                    call={{
                      id: c.id,
                      user_id: session.userId,
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
                    showThesisCoach
                    isPro={!proLocked}
                    showUpgrade={proLocked}
                    canGenerateSummary={!proLocked}
                    viewerUserId={session.userId}
                    isAdmin={session.role === "admin"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <ProfileSettingsGroup
          id="membership"
          title="Membership & billing"
          description="Plan, Stripe billing, vouchers, and account email"
          defaultOpen={membershipOpen}
        >
          <ProfileBillingSection
            subscriptionStatus={profile.subscriptionStatus}
            membershipTier={profile.membershipTier}
            billingInterval={profile.billingInterval}
            stripeCustomerId={profile.stripeCustomerId}
          />
          <ProfileVouchersSection
            subscriptionStatus={profile.subscriptionStatus}
            storedMembershipTier={profile.membershipTier}
            proGrantedUntil={profile.proGrantedUntil ?? session.proGrantedUntil ?? null}
          />
          <ProfileEmailSection />
        </ProfileSettingsGroup>

        <ProfileSettingsGroup
          id="sharing"
          title="Growth & integrations"
          description="Referrals, X spotlight opt-in, and Discord"
          defaultOpen={false}
        >
          <ProfileReferralSection />
          <ProfileSocialHighlightSection />
          <ProfileDiscordSection />
        </ProfileSettingsGroup>
      </div>
    </AppShell>
  );
}
