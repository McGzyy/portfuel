import type { Metadata } from "next";
import { BookPageLoader } from "@/components/book/BookPageLoader";
import { requireDashboardSession } from "@/lib/dashboard/data";

export const metadata: Metadata = {
  title: "Your positions",
};

export default async function DashboardBookPage() {
  const session = await requireDashboardSession();
  return <BookPageLoader session={session} />;
}
