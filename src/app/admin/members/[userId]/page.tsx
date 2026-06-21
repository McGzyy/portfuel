import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminMemberDetailPanel } from "@/components/admin/AdminMemberDetailPanel";
import { AdminWorkspaceFrame } from "@/components/admin/AdminWorkspaceFrame";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { fetchWorkspaceHeaderAccount } from "@/lib/workspace/header-account";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const { userId } = await params;
  const workspaceAccount = await fetchWorkspaceHeaderAccount(session);

  return (
    <AppShell
      user={toHeaderUser(session)}
      headerMode="workspace"
      workspaceAccount={workspaceAccount}
      mainClassName="!max-w-none !px-0 !py-0"
    >
      <AdminWorkspaceFrame>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
            </div>
          }
        >
          <AdminMemberDetailPanel userId={userId} />
        </Suspense>
      </AdminWorkspaceFrame>
    </AppShell>
  );
}
