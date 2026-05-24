import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminMembersPanel } from "@/components/admin/AdminMembersPanel";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <AppShell user={toHeaderUser(session)}>
      <PageHeader
        title="Administration"
        description="Manage member access, quotas, and trusted status. Stripe billing will automate activation later."
      />
      <AdminMembersPanel />
    </AppShell>
  );
}
