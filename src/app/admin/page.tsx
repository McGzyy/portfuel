import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminCommandHeader } from "@/components/admin/AdminCommandHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminWorkspaceFrame } from "@/components/admin/AdminWorkspaceFrame";
import {
  WorkspaceSearchHeaderTrigger,
  WorkspaceSearchShell,
} from "@/components/search/WorkspaceSearchShell";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchWorkspaceHeaderAccount } from "@/lib/workspace/header-account";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const workspaceAccount = await fetchWorkspaceHeaderAccount(session);

  return (
    <WorkspaceSearchShell>
      <AppShell
        user={toHeaderUser(session)}
        headerMode="workspace"
        headerCenter={<WorkspaceSearchHeaderTrigger />}
        workspaceAccount={workspaceAccount}
        mainClassName="!max-w-none !px-0 !py-0"
      >
        <AdminWorkspaceFrame>
          <AdminCommandHeader />
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
              </div>
            }
          >
            <AdminShell />
          </Suspense>
        </AdminWorkspaceFrame>
      </AppShell>
    </WorkspaceSearchShell>
  );
}
