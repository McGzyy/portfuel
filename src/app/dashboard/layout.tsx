import { AppShell } from "@/components/layout/AppShell";
import { MemberNav } from "@/components/dashboard/MemberNav";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { toHeaderUser } from "@/lib/auth/session-user";

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
          <WorkspaceSidebar />
        </div>
        <div className="pf-workspace-main">
          <div className="border-b border-[var(--pf-border)] bg-white lg:hidden">
            <MemberNav />
          </div>
          <div className="pf-workspace-content">{children}</div>
        </div>
      </div>
    </AppShell>
  );
}
