"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isProGrantActive } from "@/lib/billing/effective-access";

const VOUCHER_ERRORS: Record<string, string> = {
  not_found: "Code not found.",
  inactive: "This code is no longer active.",
  expired: "This code has expired.",
  max_uses: "This code has reached its use limit.",
  user_max_uses: "You have already used this code.",
  already_pro: "You already have Pro Intelligence on your subscription.",
  not_member: "Pro trial codes require an active Member subscription.",
  wrong_kind: "This code is for checkout, not upgrades.",
  affiliate_required: "This code must be used with a referral link.",
  not_assigned: "This code is not available for your account.",
};

type Props = {
  subscriptionStatus: "pending" | "active" | "cancelled";
  storedMembershipTier: "member" | "pro" | null;
  proGrantedUntil: string | null;
};

export function ProfileVouchersSection({
  subscriptionStatus,
  storedMembershipTier,
  proGrantedUntil,
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const grantActive = isProGrantActive(proGrantedUntil);
  const canRedeemProTrial =
    subscriptionStatus === "active" && storedMembershipTier === "member";

  const redeem = useCallback(async () => {
    const trimmed = code.trim();
    if (trimmed.length < 3) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(VOUCHER_ERRORS[data.error] ?? "Could not redeem this code.");
        return;
      }
      const until = data.proGrantedUntil
        ? new Date(data.proGrantedUntil).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "";
      setSuccess(until ? `Pro Intelligence active until ${until}.` : "Code applied.");
      setCode("");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [code, router]);

  if (subscriptionStatus !== "active" && !grantActive) {
    return null;
  }

  return (
    <section className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Promotions
      </p>

      {grantActive && proGrantedUntil ? (
        <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Pro Intelligence trial active until{" "}
          <span className="font-semibold">
            {new Date(proGrantedUntil).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          . Your Stripe plan stays Member; intelligence features unlock until then.
        </p>
      ) : null}

      {canRedeemProTrial ? (
        <div className={grantActive ? "mt-4" : "mt-2"}>
          <p className="text-sm text-[var(--pf-gray-600)]">
            Have an upgrade code? Redeem it for time-limited Pro Intelligence access.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="UPGRADE14"
              className="font-mono sm:max-w-xs"
              autoComplete="off"
            />
            <Button
              type="button"
              disabled={loading || code.trim().length < 3}
              onClick={() => void redeem()}
            >
              {loading ? "Applying…" : "Redeem"}
            </Button>
          </div>
          {error ? <p className="mt-2 text-sm text-[var(--pf-red)]">{error}</p> : null}
          {success ? <p className="mt-2 text-sm text-emerald-700">{success}</p> : null}
        </div>
      ) : null}

      {!canRedeemProTrial && !grantActive ? (
        <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
          Checkout promo codes can be entered when you subscribe or on the join page.
        </p>
      ) : null}
    </section>
  );
}
