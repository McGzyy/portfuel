import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OverviewPageLoader } from "@/components/dashboard/OverviewPageLoader";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { OverviewLayoutProvider } from "@/components/dashboard/OverviewLayoutProvider";
import { OverviewPublishFab } from "@/components/dashboard/OverviewPublishFab";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Overview",
};

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  if (params.tab || params.filter || params.q) {
    const qs = new URLSearchParams();
    if (params.tab) qs.set("tab", params.tab);
    if (params.filter) qs.set("filter", params.filter);
    if (params.q) qs.set("q", params.q);
    redirect(`/dashboard/feed?${qs.toString()}`);
  }

  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const isPro = !isProIntelligenceLocked(proContext);

  return (
    <OverviewLayoutProvider userId={session.userId} isPro={isPro}>
      <OverviewPageLoader session={session} />
      <OverviewPublishFab />
    </OverviewLayoutProvider>
  );
}
