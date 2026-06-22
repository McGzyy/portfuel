import { getSession } from "@/lib/auth/session";
import { DashboardWorkspaceFrame } from "@/components/dashboard/DashboardWorkspaceFrame";

/**
 * Shared workspace shell for /dashboard, /ticker, /member, and /calls/new.
 * Keeps sidebar + header mounted across in-app navigation instead of remounting
 * separate layouts per route group.
 */
export default async function WorkspaceShellLayout({
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
