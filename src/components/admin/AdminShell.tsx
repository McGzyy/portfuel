"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
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

const tabs = [
  { id: "members", label: "Members" },
  { id: "vouchers", label: "Vouchers" },
  { id: "launch", label: "Launch" },
  { id: "announcements", label: "Announcements" },
  { id: "support", label: "Support" },
  { id: "churn", label: "Churn" },
  { id: "social", label: "Social" },
  { id: "marketing", label: "Marketing" },
  { id: "x-ingest", label: "X Ingest" },
  { id: "analytics", label: "Analytics" },
  { id: "desk", label: "Desk" },
] as const;

type AdminTab = (typeof tabs)[number]["id"];

function parseTab(raw: string | null): AdminTab {
  if (
    raw === "analytics" ||
    raw === "desk" ||
    raw === "launch" ||
    raw === "social" ||
    raw === "marketing" ||
    raw === "announcements" ||
    raw === "churn" ||
    raw === "support" ||
    raw === "x-ingest" ||
    raw === "vouchers"
  ) {
    return raw;
  }
  return "members";
}

export function AdminShell() {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  return (
    <>
      <nav
        className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--pf-border)] pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Admin sections"
      >
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === "members" ? "/admin" : `/admin?tab=${t.id}`}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
              tab === t.id
                ? "border-[var(--pf-red)] text-[var(--pf-black)]"
                : "border-transparent text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
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
    </>
  );
}
