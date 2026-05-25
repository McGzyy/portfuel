"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** After Stripe Customer Portal, refresh server components with latest tier/status. */
export function BillingSessionSync() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("billing") !== "return") return;

    let cancelled = false;

    (async () => {
      try {
        await fetch("/api/auth/session-sync", { method: "POST" });
        if (!cancelled) router.refresh();
      } catch {
        /* getSession sync on next navigation still applies */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return null;
}
