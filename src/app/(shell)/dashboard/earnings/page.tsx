import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Earnings",
};

export default function DashboardEarningsPage() {
  redirect("/dashboard/research?tab=earnings");
}
