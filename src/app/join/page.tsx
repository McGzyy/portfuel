"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CompleteCheckoutButton } from "@/components/billing/BillingActions";
import type { MembershipTier } from "@/lib/stripe/config";
import { cn } from "@/lib/utils";

type Step = "plan" | "account" | "done";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = searchParams.get("pending") === "1";
  const cancelled = searchParams.get("cancelled") === "1";

  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>("plan");
  const [selectedTier, setSelectedTier] = useState<MembershipTier>("pro");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/status")
      .then((r) => r.json())
      .then((d) => setStripeEnabled(Boolean(d.configured)))
      .catch(() => setStripeEnabled(false));
  }, []);

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          displayName,
          acceptedTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "username_taken"
            ? "That username is taken. Choose another."
            : data.error === "invalid_input"
              ? "Accept the Terms of Service and Privacy Policy to continue."
              : data.message ?? "Registration failed. Check your details."
        );
        return;
      }

      if (stripeEnabled) {
        const checkoutRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: selectedTier, userId: data.userId }),
        });
        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok || !checkoutData.url) {
          setError(
            checkoutData.error === "stripe_not_configured"
              ? "Billing is not configured. Your account was created — sign in after an admin activates you."
              : "Account created but checkout failed. Sign in from the pending page to pay."
          );
          setStep("done");
          return;
        }
        window.location.href = checkoutData.url;
        return;
      }

      setStep("done");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--pf-gray-50)]">
      <div className="border-b border-[var(--pf-border)] bg-white px-4 py-5 shadow-[var(--pf-shadow-sm)]">
        <div className="mx-auto flex max-w-3xl justify-center">
          <Logo size="lg" />
        </div>
      </div>
      <div className="pf-hero-mesh border-b border-[var(--pf-border)] py-10 text-center">
        <p className="pf-eyebrow">Member intelligence</p>
        <h1 className="pf-display mt-3 text-2xl sm:text-3xl">Access the full workspace</h1>
        <p className="pf-lead mx-auto mt-3 max-w-lg text-sm">
          {stripeEnabled
            ? "Choose a plan, create your account, and checkout securely with Stripe. 2FA is required after activation."
            : "Create your account — billing activates manually until Stripe keys are configured."}
        </p>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {cancelled ? (
          <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-4 py-3 text-sm text-[var(--pf-gray-600)]">
            Checkout was cancelled. Pick a plan and try again when you&apos;re ready.
          </div>
        ) : null}

        {pending ? (
          <Card className="pf-card-elevated mb-6 border-0 shadow-[var(--pf-shadow-lg)]">
            <CardContent className="space-y-4 py-8">
              <p className="text-center text-sm text-[var(--pf-gray-600)]">
                Your account is registered but membership isn&apos;t active yet. Complete
                Stripe checkout or wait for admin activation.
              </p>
              {stripeEnabled ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <CompleteCheckoutButton tier="member" label="Checkout — Member $79/mo" />
                  <CompleteCheckoutButton
                    tier="pro"
                    label="Checkout — Pro $129/mo"
                  />
                </div>
              ) : null}
              <p className="text-center text-sm">
                <Link href="/login" className="font-semibold text-[var(--pf-red)] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : null}

        {step === "plan" && !pending ? (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <p className="pf-eyebrow">Plans</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">Choose your tier</h1>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                {stripeEnabled
                  ? "You’ll create your account next, then pay via Stripe Checkout."
                  : "Stripe is not configured on this environment — accounts stay pending until activated."}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <PlanCard
                  name="Member"
                  price="$79"
                  period="/mo"
                  tier="member"
                  selected={selectedTier === "member"}
                  onSelect={() => setSelectedTier("member")}
                  features={[
                    "Full member workspace & feed",
                    "Ticker charts + call markers",
                    "Profile performance curve",
                    "Rankings & community votes",
                  ]}
                />
                <PlanCard
                  name="Pro Intelligence"
                  price="$129"
                  period="/mo"
                  tier="pro"
                  selected={selectedTier === "pro"}
                  highlight
                  onSelect={() => setSelectedTier("pro")}
                  features={[
                    "Everything in Member",
                    "Pro market intel (news, filings)",
                    "Advanced feed & leaderboard analytics",
                    "Higher call limits",
                  ]}
                />
              </div>
              <Button className="w-full" size="lg" onClick={() => setStep("account")}>
                Continue with {selectedTier === "pro" ? "Pro" : "Member"}
              </Button>
              <p className="text-center text-sm text-[var(--pf-gray-500)]">
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-[var(--pf-red)] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : null}

        {step === "account" && !pending ? (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <h1 className="text-xl font-bold tracking-tight">Account details</h1>
              <p className="mt-1.5 text-sm text-[var(--pf-gray-500)]">
                Plan:{" "}
                <span className="font-semibold text-[var(--pf-black)]">
                  {selectedTier === "pro" ? "Pro Intelligence" : "Member"} ($
                  {selectedTier === "pro" ? "129" : "79"}/mo)
                </span>
                . Username is permanent.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="fuel_trader"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
                  Display name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
                  placeholder="How you appear on calls"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--pf-red)]"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span className="text-sm leading-relaxed text-[var(--pf-gray-600)]">
                  I agree to the{" "}
                  <Link href="/terms" className="font-semibold text-[var(--pf-red)] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-semibold text-[var(--pf-red)] hover:underline">
                    Privacy Policy
                  </Link>
                  . I understand PortFuel is not investment advice and trading involves risk of
                  loss.
                </span>
              </label>
              {error ? (
                <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
                  {error}
                </p>
              ) : null}
              <Button
                className="w-full"
                size="lg"
                disabled={
                  loading ||
                  !acceptedTerms ||
                  username.length < 3 ||
                  password.length < 8 ||
                  displayName.length < 2
                }
                onClick={handleRegister}
              >
                {loading
                  ? "Please wait…"
                  : stripeEnabled
                    ? "Create account & checkout"
                    : "Create account"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
                onClick={() => setStep("plan")}
              >
                ← Back to plans
              </button>
            </CardContent>
          </Card>
        ) : null}

        {step === "done" && !pending ? (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Account created</h1>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                Username{" "}
                <span className="font-mono font-bold text-[var(--pf-black)]">@{username}</span>{" "}
                is reserved.
                {stripeEnabled
                  ? " Complete checkout from sign-in if you weren’t redirected."
                  : " Sign in after an admin activates your membership, then set up 2FA."}
              </p>
              <Button className="mt-8" size="lg" onClick={() => router.push("/login")}>
                Go to sign in
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  tier,
  features,
  highlight,
  selected,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  tier: MembershipTier;
  features: string[];
  highlight?: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[var(--pf-radius-lg)] border p-5 text-left transition-all",
        selected
          ? "border-[var(--pf-red)] ring-2 ring-[var(--pf-red)]/30 shadow-[var(--pf-shadow-md)]"
          : "border-[var(--pf-border)] bg-white hover:border-[var(--pf-gray-300)]",
        highlight && !selected && "border-[var(--pf-red)]/40 bg-gradient-to-b from-[var(--pf-red-muted)] to-white"
      )}
    >
      {highlight ? (
        <span className="inline-block rounded-full bg-[var(--pf-red)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Popular
        </span>
      ) : null}
      <h3 className="mt-2 text-lg font-bold tracking-tight">{name}</h3>
      <p className="mt-2">
        <span className="text-3xl font-bold tracking-tight">{price}</span>
        <span className="text-[var(--pf-gray-500)]">{period}</span>
      </p>
      <ul className="mt-4 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-[var(--pf-gray-600)]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs font-semibold text-[var(--pf-red)]">
        {selected ? "Selected" : "Select plan"}
      </p>
    </button>
  );
}
