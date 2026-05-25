import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppShell user={toHeaderUser(session)}>
      <WorkspaceBackLink />
      <NotificationsList />
    </AppShell>
  );
}
