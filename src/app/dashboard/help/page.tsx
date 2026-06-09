import type { Metadata } from "next";
import { HelpWorkspace } from "@/components/help/HelpWorkspace";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { parseHelpSection } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Help & support",
};

export default async function DashboardHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; view?: string; ticket?: string }>;
}) {
  await requireDashboardSession();
  const params = await searchParams;
  const sectionId = parseHelpSection(params.section);
  const ticketsView = params.view === "tickets" || Boolean(params.ticket);

  return <HelpWorkspace sectionId={sectionId} ticketsView={ticketsView} />;
}
