import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Community screener",
};

export default function DashboardScreenerPage() {
  redirect("/dashboard/research?tab=screener");
}
