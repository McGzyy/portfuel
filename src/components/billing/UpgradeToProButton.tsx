"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatMoneyFromCents } from "@/lib/stripe/format-money";
import { PLAN_BY_TIER } from "@/lib/marketing/plans";
import type { MemberToProUpgradePreview } from "@/lib/stripe/upgrade-preview";

function formatPeriodEnd(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UpgradeToProButton({ className }: { className?: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<MemberToProUpgradePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const res = await fetch("/api/stripe/upgrade-preview");
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(
          data.error === "already_pro"
            ? "You are already on Pro Intelligence."
            : "Could not load upgrade estimate."
        );
        return;
      }
      setPreview(data as MemberToProUpgradePreview);
    } catch {
      setPreviewError("Could not load upgrade estimate.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function confirmUpgrade() {
    if (!preview) return;
    setConfirming(true);
    setUpgradeError("");
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prorationDate: preview.prorationDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpgradeError(
          data.error === "already_pro"
            ? "You are already on Pro Intelligence."
            : data.error === "no_stripe_subscription"
              ? "No subscription on file. Use Manage billing or contact support."
              : "Upgrade failed. Try again or use Manage billing."
        );
        return;
      }
      router.refresh();
      setShowConfirm(false);
    } catch {
      setUpgradeError("Something went wrong.");
    } finally {
      setConfirming(false);
    }
  }

  const proMonthly = preview
    ? formatMoneyFromCents(preview.proMonthlyCents, preview.currency)
    : PLAN_BY_TIER.pro.price;

  if (previewLoading) {
    return (
      <div className={className}>
        <p className="text-sm text-[var(--pf-gray-500)]">Loading upgrade estimate…</p>
      </div>
    );
  }

  if (previewError) {
    return (
      <div className={className}>
        <p className="text-sm text-rose-600">{previewError}</p>
      </div>
    );
  }

  if (!preview) return null;

  const prorationLabel = formatMoneyFromCents(
    Math.abs(preview.prorationCents),
    preview.currency
  );
  const periodEnd = formatPeriodEnd(preview.currentPeriodEnd);
  const isCredit = preview.prorationCents < 0;

  return (
    <div className={className}>
      <div className="pf-workspace-panel p-4">
        <p className="text-sm font-semibold text-[var(--pf-black)]">
          Upgrade to Pro Intelligence — {proMonthly}/mo
        </p>
        <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
          {isCredit ? (
            <>
              Estimated credit for unused Member time:{" "}
              <span className="font-semibold text-[var(--pf-black)]">{prorationLabel}</span>
            </>
          ) : preview.prorationCents > 0 ? (
            <>
              Estimated proration for the rest of this billing period:{" "}
              <span className="font-semibold text-[var(--pf-black)]">~{prorationLabel}</span>
            </>
          ) : (
            <>No proration charge estimated for the current period.</>
          )}
        </p>
        <p className="mt-1.5 text-xs text-[var(--pf-gray-500)]">
          Stripe applies proration on your next invoice (around {periodEnd}). Your card may be
          charged immediately in some cases. Estimate only — final amount from Stripe.
        </p>
        {!showConfirm ? (
          <Button type="button" className="mt-4" onClick={() => setShowConfirm(true)}>
            Review upgrade
          </Button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" disabled={confirming} onClick={() => void confirmUpgrade()}>
              {confirming ? "Upgrading…" : `Confirm upgrade — ${proMonthly}/mo`}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={confirming}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      {upgradeError ? <p className="mt-2 text-sm text-rose-600">{upgradeError}</p> : null}
    </div>
  );
}
