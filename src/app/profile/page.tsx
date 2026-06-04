import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CallCard } from "@/components/calls/CallCard";
import { MemberProfileHero } from "@/components/member/MemberProfileHero";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import { ProfileCallsSectionHeader } from "@/components/profile/ProfileCallsSectionHeader";
import { CallsEmptyState } from "@/components/calls/CallsEmptyState";
import { mapCallRowToCardData } from "@/lib/calls/card-display";
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

        <section id="calls" className="scroll-mt-24 space-y-6">
          <ProfileCallsSectionHeader callCount={calls.length} trackRecord={trackRecord} />

          {calls.length === 0 ? (
            <CallsEmptyState
              title="No calls on your book yet"
              description="Publish a thesis with entry, target, and stop — it goes on your profile, rankings score, and member feed."
              secondaryHref="/dashboard/feed"
              secondaryLabel="Browse member feed"
            />
          ) : (
            <ul className="space-y-4">
              {calls.map((c) => (
                <li key={c.id}>
                  <CallCard
                    call={mapCallRowToCardData(
                      c,
                      {
                        display_name: member.display_name,
                        username: member.username,
                        trusted: member.trusted,
                      },
                      { user_id: session.userId }
                    )}
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
