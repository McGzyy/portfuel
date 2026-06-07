"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CancellationFeedbackForm } from "@/components/settings/CancellationFeedbackForm";

/** After Stripe cancel flow, prompt for feedback if not submitted recently. */
export function BillingReturnFeedbackPrompt() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (searchParams.get("billing") !== "return") return;
    if (searchParams.get("cancel") !== "1") return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/billing/cancellation-feedback/recent");
        if (!res.ok) return;
        const data = (await res.json()) as { hasRecent: boolean };
        if (!cancelled && !data.hasRecent) setVisible(true);
      } catch {
        /* optional prompt */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function clearCancelParam() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cancel");
    params.delete("billing");
    const qs = params.toString();
    router.replace(
      qs ? `/dashboard/settings?section=billing&${qs}` : "/dashboard/settings?section=billing",
      { scroll: false }
    );
  }

  function handleDone() {
    setVisible(false);
    setDismissed(true);
    clearCancelParam();
  }

  if (!visible || dismissed) return null;

  return (
    <section className="rounded-[var(--pf-radius-lg)] border border-amber-200 bg-amber-50/60 p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800/80">
        Quick feedback
      </p>
      <h3 className="mt-1 text-base font-bold text-amber-950">Sorry to see you go</h3>
      <CancellationFeedbackForm
        source="post_portal"
        submitLabel="Send feedback"
        skipLabel="Dismiss"
        onSubmitted={handleDone}
        onSkip={handleDone}
        className="mt-3"
      />
    </section>
  );
}
