"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const HASH_TO_SECTION: Record<string, string> = {
  billing: "billing",
  email: "notifications",
  alerts: "notifications",
  referrals: "sharing",
  integrations: "integrations",
};

function SettingsRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const fromHash = hash ? HASH_TO_SECTION[hash] : null;
    const section = fromHash ?? searchParams.get("section") ?? "billing";
    const billing = searchParams.get("billing");
    const params = new URLSearchParams();
    if (section !== "billing") params.set("section", section);
    if (billing) params.set("billing", billing);
    const qs = params.toString();
    router.replace(`/dashboard/settings${qs ? `?${qs}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
    </div>
  );
}

export function SettingsLegacyRedirect() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
        </div>
      }
    >
      <SettingsRedirectInner />
    </Suspense>
  );
}
