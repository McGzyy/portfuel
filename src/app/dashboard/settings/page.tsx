import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { ProfileBillingSection } from "@/components/billing/ProfileBillingSection";
import { ProfileAlertsSection } from "@/components/profile/ProfileAlertsSection";
import { ProfileEmailSection } from "@/components/profile/ProfileEmailSection";
import { ProfileReferralSection } from "@/components/profile/ProfileReferralSection";
import { ProfileSocialHighlightSection } from "@/components/profile/ProfileSocialHighlightSection";
import { ProfileVouchersSection } from "@/components/profile/ProfileVouchersSection";
import { ProfileDiscordSection } from "@/components/profile/ProfileDiscordSection";
import { SettingsAccountSummary } from "@/components/settings/SettingsAccountSummary";
import { SettingsDangerZone } from "@/components/settings/SettingsDangerZone";
import {
  parseSettingsSection,
  SettingsNav,
  SettingsNavMobile,
} from "@/components/settings/SettingsNav";
import { SettingsBillingSync } from "@/app/settings/BillingSync";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { requireDashboardSession } from "@/lib/dashboard/data";
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

  return (
    <>
      <SettingsBillingSync />
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Account
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
            Membership, notifications, referrals, and integrations.
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
          subscriptionStatus={profile.subscriptionStatus}
          membershipTier={profile.membershipTier}
          billingInterval={profile.billingInterval}
          emailVerified={session.emailVerified}
          memberSince={profile.member.created_at}
        />

        <SettingsNavMobile active={section} />

        <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
          <div className="hidden lg:block">
            <SettingsNav active={section} />
          </div>

          <div className="min-w-0 space-y-6">
            {proLocked && section === "billing" ? <ProMembershipStrip locked /> : null}

            {section === "billing" ? (
              <section aria-label="Plan and billing" className="space-y-4">
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
                <SettingsDangerZone
                  subscriptionStatus={profile.subscriptionStatus}
                  stripeCustomerId={profile.stripeCustomerId}
                />
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
          </div>
        </div>
      </div>
    </>
  );
}
