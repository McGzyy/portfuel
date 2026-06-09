"use client";

import { useSearchParams } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMembersPanel } from "@/components/admin/AdminMembersPanel";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { AdminDeskPanel } from "@/components/admin/AdminDeskPanel";
import { AdminLaunchPanel } from "@/components/admin/AdminLaunchPanel";
import { AdminSocialPanel } from "@/components/admin/AdminSocialPanel";
import { AdminXIngestPanel } from "@/components/admin/AdminXIngestPanel";
import { AdminVouchersPanel } from "@/components/admin/AdminVouchersPanel";
import { AdminMarketingPanel } from "@/components/admin/AdminMarketingPanel";
import { AdminAnnouncementsPanel } from "@/components/admin/AdminAnnouncementsPanel";
import { AdminCancellationFeedbackPanel } from "@/components/admin/AdminCancellationFeedbackPanel";
import { AdminSupportPanel } from "@/components/admin/AdminSupportPanel";
import { parseAdminTab } from "@/lib/admin/nav";

export function AdminShell() {
  const searchParams = useSearchParams();
  const tab = parseAdminTab(searchParams.get("tab"));

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-8">
      <AdminSidebar />
      <div className="min-w-0">
        {tab === "analytics" ? (
          <AdminAnalyticsPanel />
        ) : tab === "desk" ? (
          <AdminDeskPanel />
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
        ) : tab === "marketing" ? (
          <AdminMarketingPanel />
        ) : tab === "x-ingest" ? (
          <AdminXIngestPanel />
        ) : tab === "vouchers" ? (
          <AdminVouchersPanel />
        ) : (
          <AdminMembersPanel />
        )}
      </div>
    </div>
  );
}
