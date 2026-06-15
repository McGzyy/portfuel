import { getSession } from "@/lib/auth/session";
import { DashboardWorkspaceFrame } from "@/components/dashboard/DashboardWorkspaceFrame";

/** Wraps publish, ticker, and profile in the same workspace shell as /dashboard when logged in. */
export default async function WorkspaceSatelliteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.canAccessWorkspace) {
    return children;
  }

  return <DashboardWorkspaceFrame session={session}>{children}</DashboardWorkspaceFrame>;
}
