"use client";

import { useSearchParams } from "next/navigation";
import { AdminMembersPanel } from "@/components/admin/AdminMembersPanel";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { AdminDiscoveryPanel } from "@/components/admin/AdminDiscoveryPanel";
import { AdminDeskPanel } from "@/components/admin/AdminDeskPanel";
import { AdminLaunchPanel } from "@/components/admin/AdminLaunchPanel";
import { AdminSocialPanel } from "@/components/admin/AdminSocialPanel";
import { AdminVouchersPanel } from "@/components/admin/AdminVouchersPanel";
import { AdminMarketingPanel } from "@/components/admin/AdminMarketingPanel";
import { AdminAnnouncementsPanel } from "@/components/admin/AdminAnnouncementsPanel";
import { AdminCancellationFeedbackPanel } from "@/components/admin/AdminCancellationFeedbackPanel";
import { AdminSupportPanel } from "@/components/admin/AdminSupportPanel";
import { AdminDiscordPanel } from "@/components/admin/AdminDiscordPanel";
import { parseAdminTab } from "@/lib/admin/nav";

export function AdminShell() {
  const searchParams = useSearchParams();
  const tab = parseAdminTab(searchParams.get("tab"));

  return (
    <div className="min-w-0">
        {tab === "analytics" ? (
          <AdminAnalyticsPanel />
        ) : tab === "desk" ? (
          <AdminDeskPanel />
        ) : tab === "discovery" ? (
          <AdminDiscoveryPanel />
        ) : tab === "launch" ? (
          <AdminLaunchPanel />
        ) : tab === "announcements" ? (
          <AdminAnnouncementsPanel />
        ) : tab === "churn" ? (
          <AdminCancellationFeedbackPanel />
        ) : tab === "support" ? (
          <AdminSupportPanel />
        ) : tab === "social" ? (
          <AdminSocialPanel />
        ) : tab === "discord" ? (
          <AdminDiscordPanel />
        ) : tab === "marketing" ? (
          <AdminMarketingPanel />
        ) : tab === "vouchers" ? (
          <AdminVouchersPanel />
        ) : (
          <AdminMembersPanel />
        )}
      </div>
  );
}
