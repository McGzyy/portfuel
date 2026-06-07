import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsLegacyRedirect } from "@/components/settings/SettingsLegacyRedirect";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";

export const metadata: Metadata = {
  title: "Settings",
};

/** Legacy URL — redirects into workspace settings at /dashboard/settings. */
export default async function SettingsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; section?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  if (params.section || params.billing === "return") {
    const q = new URLSearchParams();
    if (params.section) q.set("section", params.section);
    if (params.billing) q.set("billing", params.billing);
    redirect(`/dashboard/settings?${q.toString()}`);
  }

  return (
    <AppShell user={toHeaderUser(session)}>
      <SettingsLegacyRedirect />
    </AppShell>
  );
}
