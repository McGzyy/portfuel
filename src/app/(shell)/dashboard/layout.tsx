import { requireDashboardSession } from "@/lib/dashboard/data";
import { workspaceMetadata } from "@/lib/seo/site";

export const metadata = workspaceMetadata;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardSession();
  return children;
}
