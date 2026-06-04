import type { Metadata } from "next";
import { NotificationsList } from "@/components/notifications/NotificationsList";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function DashboardNotificationsPage() {
  return <NotificationsList />;
}
