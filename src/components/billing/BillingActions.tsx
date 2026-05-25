"use client";

import { useState } from "react";
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
