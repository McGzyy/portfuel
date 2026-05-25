import { AppShell } from "@/components/layout/AppShell";
import { MemberNav } from "@/components/dashboard/MemberNav";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { WorkspaceContent } from "@/components/dashboard/WorkspaceContent";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { toHeaderUser } from "@/lib/auth/session-user";
import { workspaceMetadata } from "@/lib/seo/site";

export const metadata = workspaceMetadata;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDashboardSession();

  return (
    <AppShell user={toHeaderUser(session)} mainClassName="!max-w-none !px-0 !py-0">
      <div className="pf-workspace">
        <div className="pf-workspace-sidebar-wrap">
          <WorkspaceSidebar
            username={session.username}
            displayName={
              session.displayName ??
              (session.role === "admin" ? "Administrator" : session.username)
            }
            isAdmin={session.role === "admin"}
          />
        </div>
        <div className="pf-workspace-main">
          <div className="border-b border-[var(--pf-border)] bg-white lg:hidden">
            <MemberNav />
          </div>
          <WorkspaceContent>{children}</WorkspaceContent>
        </div>
      </div>
    </AppShell>
  );
}
