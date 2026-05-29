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

const tabs = [
  { id: "members", label: "Members" },
  { id: "launch", label: "Launch" },
  { id: "social", label: "X Posts" },
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
    raw === "x-ingest"
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
        className="mt-6 flex gap-2 border-b border-[var(--pf-border)] pb-px"
        aria-label="Admin sections"
      >
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === "members" ? "/admin" : `/admin?tab=${t.id}`}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
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
      ) : tab === "social" ? (
        <AdminSocialPanel />
      ) : tab === "x-ingest" ? (
        <AdminXIngestPanel />
      ) : (
        <AdminMembersPanel />
      )}
    </>
  );
}
