import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileBillingSection } from "@/components/billing/ProfileBillingSection";
import { ProfileEmailSection } from "@/components/profile/ProfileEmailSection";
import { ProfileReferralSection } from "@/components/profile/ProfileReferralSection";
import { ProfileSocialHighlightSection } from "@/components/profile/ProfileSocialHighlightSection";
import { ProfileVouchersSection } from "@/components/profile/ProfileVouchersSection";
import { ProfileDiscordSection } from "@/components/profile/ProfileDiscordSection";
import { SettingsCommandHeader } from "@/components/settings/SettingsCommandHeader";
import { SettingsPageNav } from "@/components/settings/SettingsPageNav";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { SettingsBillingSync } from "@/app/settings/BillingSync";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!isDemoMode() && !hasSupabaseConfig()) {
    redirect("/dashboard");
  }

  const profile = await fetchOwnProfile(session);
  if (!profile.member) {
    redirect("/dashboard");
  }

  return (
    <AppShell user={toHeaderUser(session)}>
      <SettingsBillingSync />
      <div className="mx-auto max-w-4xl space-y-6">
        <ModerationBanner
          role={session.role}
          canPublishCalls={session.canPublishCalls}
          canDm={session.canDm}
          canComment={session.canComment}
          className="rounded-lg border border-amber-200/80"
        />

        <SettingsCommandHeader username={profile.member.username} />
        <SettingsPageNav />

        <section id="billing" className="scroll-mt-24 space-y-4">
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
        </section>

        <section id="email" className="scroll-mt-24">
          <ProfileEmailSection />
        </section>

        <section id="referrals" className="scroll-mt-24 space-y-4">
          <ProfileReferralSection />
          <ProfileSocialHighlightSection />
        </section>

        <section id="integrations" className="scroll-mt-24">
          <ProfileDiscordSection />
        </section>
      </div>
    </AppShell>
  );
}
