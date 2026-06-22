import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ticker compare",
};

export default async function DashboardComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ tab: "compare" });
  if (params.symbols) qs.set("symbols", params.symbols);
  redirect(`/dashboard/research?${qs.toString()}`);
}
