import { workspaceMetadata } from "@/lib/seo/site";

export const metadata = workspaceMetadata;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
