import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminMemberDetailPanel } from "@/components/admin/AdminMemberDetailPanel";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const { userId } = await params;

  return (
    <AppShell user={toHeaderUser(session)}>
      <PageHeader
        title="Member 360"
        description="Billing, email, moderation, and audit history for one member."
      />
      <AdminMemberDetailPanel userId={userId} />
    </AppShell>
  );
}
