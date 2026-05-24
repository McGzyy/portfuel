import { AppShell } from "@/components/layout/AppShell";
import { MemberNav } from "@/components/dashboard/MemberNav";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { toHeaderUser } from "@/lib/auth/session-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDashboardSession();

  return (
    <AppShell user={toHeaderUser(session)} mainClassName="!px-0 !py-0">
      <MemberNav />
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </AppShell>
  );
}
