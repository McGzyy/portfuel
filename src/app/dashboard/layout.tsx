import { DashboardWorkspaceFrame } from "@/components/dashboard/DashboardWorkspaceFrame";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { workspaceMetadata } from "@/lib/seo/site";

export const metadata = workspaceMetadata;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDashboardSession();
  return <DashboardWorkspaceFrame session={session}>{children}</DashboardWorkspaceFrame>;
}
