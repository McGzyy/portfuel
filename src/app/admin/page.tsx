import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminCommandHeader } from "@/components/admin/AdminCommandHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <AppShell user={toHeaderUser(session)}>
      <AdminCommandHeader />
      <Suspense
        fallback={
          <div className="mt-8 flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
          </div>
        }
      >
        <AdminShell />
      </Suspense>
    </AppShell>
  );
}
