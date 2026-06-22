import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WorkspaceLivePulse } from "@/components/dashboard/WorkspaceLivePulse";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import { SettingsContextRail } from "@/components/settings/SettingsContextRail";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { ProPerksQuickLinks } from "@/components/pro/ProPerksQuickLinks";
import { ProfileBillingSection } from "@/components/billing/ProfileBillingSection";
import { ProfileAlertsSection } from "@/components/profile/ProfileAlertsSection";
import { ProfileEmailSection } from "@/components/profile/ProfileEmailSection";
import { ProfileReferralSection } from "@/components/profile/ProfileReferralSection";
import { ProfileSocialHighlightSection } from "@/components/profile/ProfileSocialHighlightSection";
import { ProfileVouchersSection } from "@/components/profile/ProfileVouchersSection";
import { ProfileDiscordSection } from "@/components/profile/ProfileDiscordSection";
import { SettingsAccountSummary } from "@/components/settings/SettingsAccountSummary";
import { SettingsMembershipOverview } from "@/components/settings/SettingsMembershipOverview";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsSecuritySection } from "@/components/settings/SettingsSecuritySection";
import { SettingsDangerZone } from "@/components/settings/SettingsDangerZone";
import { SettingsAppearanceSection } from "@/components/settings/SettingsAppearanceSection";
import { BillingReturnFeedbackPrompt } from "@/components/settings/BillingReturnFeedbackPrompt";
import {
  parseSettingsSection,
  SettingsNavMobile,
} from "@/components/settings/SettingsNav";
import { SettingsBillingSync } from "@/app/settings/BillingSync";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; billing?: string }>;
}) {
  const session = await requireDashboardSession();

  if (!isDemoMode() && !hasSupabaseConfig()) {
    redirect("/dashboard");
  }

  const profile = await fetchOwnProfile(session);
  if (!profile.member) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const section = parseSettingsSection(params.section);
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));

  let watchlistSymbols: string[] = [];
  try {
    const wl = await fetchWatchlist(session.userId);
    watchlistSymbols = wl.map((w) => w.symbol);
  } catch {
    /* optional */
  }

  return (
    <>
      <SettingsBillingSync />
      <WorkspaceContextShell
        pulseLabel="Settings pulse"
        rail={
          <SettingsContextRail
            active={section}
            membershipTier={profile.membershipTier}
            emailVerified={session.emailVerified}
            username={profile.member.username}
          />
        }
        mainClassName="space-y-4 sm:space-y-6 pb-14 lg:pb-0"
      >
        <WorkspaceLivePulse userId={session.userId} isPro={!proLocked} />
        <div className="pf-settings-page space-y-4 sm:space-y-6">
        <header className="px-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Account
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--pf-black)] sm:mt-1.5 sm:text-2xl">
            Settings
          </h1>
          <p className="mt-1 hidden text-sm text-[var(--pf-gray-500)] sm:block">
            Profile, membership, notifications, referrals, and integrations.
          </p>
        </header>

        <ModerationBanner
          role={session.role}
          canPublishCalls={session.canPublishCalls}
          canDm={session.canDm}
          canComment={session.canComment}
          className="rounded-lg border border-amber-200/80"
        />

        <SettingsAccountSummary
          username={profile.member.username}
          displayName={profile.member.display_name}
          avatarUrl={profile.member.avatar_url}
          subscriptionStatus={profile.subscriptionStatus}
          membershipTier={profile.membershipTier}
          billingInterval={profile.billingInterval}
          emailVerified={session.emailVerified}
          memberSince={profile.member.created_at}
          role={session.role}
        />

        <SettingsNavMobile active={section} />

        <div className="min-w-0 space-y-4 sm:space-y-6">
            {proLocked && section === "billing" ? (
              <ProMembershipStrip locked watchlistSymbols={watchlistSymbols} />
            ) : null}

            {!proLocked && (section === "billing" || section === "profile") ? (
              <ProPerksQuickLinks />
            ) : null}

            {section === "profile" ? (
              <section aria-label="Profile">
                <SettingsProfileSection
                  initialUsername={profile.member.username}
                  initialDisplayName={profile.member.display_name}
                  initialBio={profile.member.bio}
                  initialAvatarUrl={profile.member.avatar_url}
                />
              </section>
            ) : null}

            {section === "billing" ? (
              <section aria-label="Plan and billing" className="space-y-4">
                <Suspense fallback={null}>
                  <BillingReturnFeedbackPrompt />
                </Suspense>
                <SettingsMembershipOverview
                  userId={session.userId}
                  emailVerified={session.emailVerified}
                  role={session.role}
                />
                <ProfileBillingSection
                  subscriptionStatus={profile.subscriptionStatus}
                  membershipTier={profile.membershipTier}
                  billingInterval={profile.billingInterval}
                  stripeCustomerId={profile.stripeCustomerId}
                  watchlistSymbols={watchlistSymbols}
                />
                <ProfileVouchersSection
                  subscriptionStatus={profile.subscriptionStatus}
                  storedMembershipTier={profile.membershipTier}
                  proGrantedUntil={profile.proGrantedUntil ?? session.proGrantedUntil ?? null}
                />
                <SettingsDangerZone
                  subscriptionStatus={profile.subscriptionStatus}
                  stripeCustomerId={profile.stripeCustomerId}
                />
              </section>
            ) : null}

            {section === "security" ? (
              <section aria-label="Security">
                <SettingsSecuritySection />
              </section>
            ) : null}

            {section === "notifications" ? (
              <section aria-label="Notifications" className="space-y-4">
                <ProfileEmailSection />
                <ProfileAlertsSection />
              </section>
            ) : null}

            {section === "sharing" ? (
              <section aria-label="Sharing and referrals" className="space-y-4">
                <ProfileReferralSection />
                <ProfileSocialHighlightSection />
              </section>
            ) : null}

            {section === "integrations" ? (
              <section aria-label="Integrations">
                <ProfileDiscordSection />
              </section>
            ) : null}

            {section === "appearance" ? <SettingsAppearanceSection /> : null}
        </div>
        </div>
      </WorkspaceContextShell>
    </>
  );
}
