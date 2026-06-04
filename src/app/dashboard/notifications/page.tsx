import type { Metadata } from "next";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { requireDashboardSession } from "@/lib/dashboard/data";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function DashboardNotificationsPage() {
  const session = await requireDashboardSession();
  const proUnlocked = canAccessProIntelligence(sessionToProContext(session));
  return <NotificationsList proUnlocked={proUnlocked} />;
}
