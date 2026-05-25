"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { MembershipTier } from "@/lib/stripe/config";

export function CompleteCheckoutButton({
  tier,
  label,
  className,
}: {
  tier: MembershipTier;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(
          data.error === "stripe_not_configured"
            ? "Billing is not configured yet."
            : data.error === "already_subscribed"
              ? "You already have an active plan. Upgrade to Pro from your profile."
              : "Could not start checkout. Try again."
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button size="lg" className="w-full" disabled={loading} onClick={startCheckout}>
        {loading ? "Redirecting to Stripe…" : label ?? "Complete checkout"}
      </Button>
      {error ? <p className="mt-2 text-center text-sm text-[var(--pf-red)]">{error}</p> : null}
    </div>
  );
}

export function UpgradeToProButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upgrade() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/upgrade", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "already_pro"
            ? "You are already on Pro Intelligence."
            : data.error === "no_stripe_subscription"
              ? "No subscription on file. Use Manage billing or contact support."
              : "Upgrade failed. Try again or use Manage billing."
        );
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button disabled={loading} onClick={upgrade}>
        {loading ? "Upgrading…" : "Upgrade to Pro — $129/mo"}
      </Button>
      {error ? <p className="mt-2 text-sm text-[var(--pf-red)]">{error}</p> : null}
    </div>
  );
}

export function ManageBillingButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError("Could not open billing portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button variant="secondary" disabled={loading} onClick={openPortal}>
        {loading ? "Opening…" : "Manage billing"}
      </Button>
      {error ? <p className="mt-2 text-sm text-[var(--pf-red)]">{error}</p> : null}
    </div>
  );
}
