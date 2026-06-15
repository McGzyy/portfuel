"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TierComparisonTable } from "@/components/marketing/TierComparisonTable";
import { JoinDemoPreviewStrip } from "@/components/marketing/JoinDemoPreviewStrip";
import { BillingIntervalPicker } from "@/components/billing/BillingIntervalPicker";
import { CompleteCheckoutButton } from "@/components/billing/BillingActions";
import type { BillingInterval, MembershipTier } from "@/lib/stripe/config";
import {
  formatAnnualSavingsLine,
  formatTierPrice,
  formatTierPriceForInterval,
  MARKETING_PRICE_SUMMARY,
  planPricingForInterval,
  PLAN_ORDER,
  TIER_COMPARISON_ROWS,
} from "@/lib/marketing/plans";
import { cn } from "@/lib/utils";

type Step = "plan" | "account" | "done";

const REF_STORAGE_KEY = "portfuel_ref";
const PROMO_STORAGE_KEY = "portfuel_promo";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = searchParams.get("pending") === "1";
  const invitedPending = searchParams.get("invited") === "1";
  const cancelled = searchParams.get("cancelled") === "1";
  const refFromUrl = searchParams.get("ref")?.trim().toLowerCase() ?? "";
  const promoFromUrl = searchParams.get("promo")?.trim().toUpperCase() ?? "";
  const inviteMode = searchParams.get("invite") === "1";

  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);
  const [annualAvailable, setAnnualAvailable] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [step, setStep] = useState<Step>("plan");
  const [selectedTier, setSelectedTier] = useState<MembershipTier>("member");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [refereeOffer, setRefereeOffer] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherHint, setVoucherHint] = useState<string | null>(null);

  const selectedPlan = planPricingForInterval(selectedTier, billingInterval);

  useEffect(() => {
    fetch("/api/stripe/status")
      .then((r) => r.json())
      .then((d: { configured?: boolean; annualConfigured?: boolean }) => {
        setStripeEnabled(Boolean(d.configured));
        setAnnualAvailable(Boolean(d.annualConfigured));
      })
      .catch(() => {
        setStripeEnabled(false);
        setAnnualAvailable(false);
      });
  }, []);

  useEffect(() => {
    const code =
      refFromUrl ||
      (typeof window !== "undefined" ? sessionStorage.getItem(REF_STORAGE_KEY) ?? "" : "");
    if (!code) return;

    setReferralCode(code);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(REF_STORAGE_KEY, code);
    }

    fetch(`/api/referrals/validate?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d: { valid?: boolean; displayName?: string; refereeOffer?: string | null }) => {
        if (d.valid && d.displayName) {
          setReferrerName(d.displayName);
          setRefereeOffer(d.refereeOffer ?? null);
        }
      })
      .catch(() => undefined);
  }, [refFromUrl]);

  useEffect(() => {
    const promo =
      promoFromUrl ||
      (typeof window !== "undefined" ? sessionStorage.getItem(PROMO_STORAGE_KEY) ?? "" : "");
    if (!promo) return;
    setVoucherCode(promo);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PROMO_STORAGE_KEY, promo);
    }
  }, [promoFromUrl]);

  useEffect(() => {
    const code = voucherCode.trim();
    if (code.length < 3) {
      setVoucherHint(null);
      return;
    }
    const q = new URLSearchParams({
      code,
      tier: selectedTier,
      interval: billingInterval,
      kind: "checkout_discount",
    });
    if (referralCode) q.set("ref", referralCode);
    const t = window.setTimeout(() => {
      fetch(`/api/vouchers/validate?${q}`)
        .then((r) => r.json())
        .then((d: { valid?: boolean; label?: string; error?: string }) => {
          if (d.valid && d.label) setVoucherHint(d.label);
          else if (!d.valid) setVoucherHint(null);
        })
        .catch(() => setVoucherHint(null));
    }, 400);
    return () => window.clearTimeout(t);
  }, [voucherCode, selectedTier, referralCode, billingInterval]);

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          email: email.trim(),
          password,
          displayName,
          acceptedTerms: true,
          ...(referralCode ? { referralCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "username_taken"
            ? "That username is taken. Choose another."
            : data.error === "email_taken"
              ? "That email is already registered. Sign in or use another address."
            : data.error === "invalid_input"
              ? "Accept the Terms of Service and Privacy Policy to continue."
              : data.message ?? "Registration failed. Check your details."
        );
        return;
      }

      if (inviteMode) {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            username: username.trim().toLowerCase(),
            password,
          }),
        });
        if (!loginRes.ok) {
          setError("Account created. Sign in at /login with your username and password.");
          setStep("done");
          return;
        }
        window.location.href = "/join?pending=1&invited=1";
        return;
      }

      if (stripeEnabled) {
        const checkoutRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: selectedTier,
            billingInterval,
            userId: data.userId,
            ...(voucherCode.trim() ? { voucherCode: voucherCode.trim() } : {}),
          }),
        });
        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok || !checkoutData.url) {
          setError(
            checkoutData.error === "stripe_not_configured"
              ? "Billing is not configured. Your account was created — sign in after an admin activates you."
              : checkoutData.error === "expired" ||
                  checkoutData.error === "not_found" ||
                  checkoutData.error === "max_uses"
                ? "That promo code is not valid. Account created — sign in to retry checkout."
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
      <div className="border-b border-[var(--pf-border)] bg-[var(--pf-surface)] px-4 py-5 shadow-[var(--pf-shadow-sm)]">
        <div className="mx-auto flex max-w-4xl justify-center">
          <Logo size="lg" />
        </div>
      </div>
      <div className="pf-hero-mesh border-b border-[var(--pf-border)] py-10 text-center">
        <p className="pf-eyebrow">Member intelligence</p>
        <h1 className="pf-display mt-3 text-2xl sm:text-3xl">Join PortFuel</h1>
        <p className="pf-lead mx-auto mt-3 max-w-xl text-sm">
          {inviteMode
            ? "Create your account below — no payment step. After you register, we activate your access and you set up 2FA before the workspace."
            : stripeEnabled === null
              ? "Loading checkout options…"
              : stripeEnabled
                ? `Choose Member (${formatTierPrice("member")}) or Pro Intelligence (${formatTierPrice("pro")}), create your account, and checkout with Stripe. Member includes the full workspace — desk, feed, charts, and DMs. Upgrade anytime from profile; 2FA required after activation.`
                : "Create your account — billing activates manually until Stripe is configured on this environment."}
        </p>
        {stripeEnabled ? (
          <p className="mx-auto mt-2 max-w-lg text-center text-xs text-[var(--pf-gray-500)]">
            {MARKETING_PRICE_SUMMARY}
          </p>
        ) : null}
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10">
        {inviteMode && !pending ? (
          <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Invited access — you will not be charged. Pick a plan for your profile label, create
            your account, and skip Stripe.
          </div>
        ) : null}

        {cancelled ? (
          <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Checkout was cancelled. Your account may already exist —{" "}
            <Link href="/login" className="font-semibold underline">
              sign in here
            </Link>
            . If you were invited, you do not need to pay; ask for access activation, then sign in.
          </div>
        ) : null}

        {referrerName ? (
          <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-[var(--pf-gray-700)]">
            Invited by{" "}
            <span className="font-semibold text-[var(--pf-black)]">{referrerName}</span>
            {refereeOffer ? (
              <span className="mt-1 block font-semibold text-emerald-800">
                Referral offer: {refereeOffer} on your first month when you activate membership.
              </span>
            ) : null}
          </div>
        ) : null}

        {pending ? (
          <Card className="pf-card-elevated mb-6 border-0 shadow-[var(--pf-shadow-lg)]">
            <CardContent className="space-y-5 py-8">
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--pf-black)]">
                  {invitedPending ? "Account created" : "Complete membership checkout"}
                </p>
                <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
                  {invitedPending ? (
                    <>
                      You&apos;re signed in. Invited members do not pay through Stripe — wait for
                      access activation, then set up 2FA at{" "}
                      <Link href="/security/2fa" className="font-semibold text-[var(--pf-red)] hover:underline">
                        /security/2fa
                      </Link>
                      . Refresh this page after activation.
                    </>
                  ) : (
                    <>
                      Your account exists but isn&apos;t active yet. Member (
                      {formatTierPrice("member")}) is the full workspace — feed, desk, charts, and
                      DMs. Pro ({formatTierPrice("pro")}) adds news, screeners, intraday charts, and 6
                      calls/week.
                    </>
                  )}
                </p>
              </div>
              {stripeEnabled && !invitedPending ? (
                <>
                  <BillingIntervalPicker
                    value={billingInterval}
                    onChange={setBillingInterval}
                    annualAvailable={annualAvailable}
                    className="mx-auto"
                  />
                  {billingInterval === "annual" && annualAvailable ? (
                    <p className="text-center text-sm text-[var(--pf-gray-500)]">
                      {formatAnnualSavingsLine()}
                    </p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CompleteCheckoutButton
                      tier="member"
                      billingInterval={billingInterval}
                      label={`Member — ${formatTierPriceForInterval("member", billingInterval)}`}
                    />
                    <CompleteCheckoutButton
                      tier="pro"
                      billingInterval={billingInterval}
                      label={`Pro — ${formatTierPriceForInterval("pro", billingInterval)}`}
                    />
                  </div>
                </>
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
          <div className="space-y-8">
            <JoinDemoPreviewStrip />
            <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
              <CardHeader>
                <p className="pf-eyebrow">Step 1 of 2</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Choose your plan</h2>
                <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
                  {selectedPlan.tagline}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <BillingIntervalPicker
                    value={billingInterval}
                    onChange={setBillingInterval}
                    annualAvailable={annualAvailable}
                  />
                </div>
                {billingInterval === "annual" && annualAvailable ? (
                  <p className="text-center text-sm text-[var(--pf-gray-500)]">
                    {formatAnnualSavingsLine()}
                  </p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  {PLAN_ORDER.map((tier) => {
                    const plan = planPricingForInterval(tier, billingInterval);
                    return (
                      <PlanCard
                        key={tier}
                        tier={tier}
                        name={plan.name}
                        price={plan.price}
                        period={plan.period}
                        tagline={plan.tagline}
                        features={plan.features}
                        highlight={plan.highlight}
                        selected={selectedTier === tier}
                        onSelect={() => setSelectedTier(tier)}
                      />
                    );
                  })}
                </div>
                <Button className="w-full" size="lg" onClick={() => setStep("account")}>
                  Continue with {selectedPlan.name} — {selectedPlan.price}
                  {selectedPlan.period}
                </Button>
                <p className="text-center text-xs text-[var(--pf-gray-500)]">
                  Cancel anytime in Stripe · Prorated upgrade Member → Pro
                </p>
                <p className="text-center text-sm text-[var(--pf-gray-500)]">
                  Already registered?{" "}
                  <Link href="/login" className="font-semibold text-[var(--pf-red)] hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>

            <div>
              <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Full comparison
              </p>
              <div className="mt-4">
                <TierComparisonTable
                  rows={TIER_COMPARISON_ROWS}
                  highlightTier={selectedTier}
                  compact
                  billingInterval={billingInterval}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === "account" && !pending ? (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <p className="pf-eyebrow">Step 2 of 2</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">Create your account</h2>
              <div className="mt-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                  Your plan
                </p>
                <p className="mt-1 font-bold text-[var(--pf-black)]">
                  {selectedPlan.name} · {selectedPlan.price}
                  {selectedPlan.period}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {selectedPlan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-[var(--pf-gray-600)]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--pf-red)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold text-[var(--pf-red)] hover:underline"
                  onClick={() => setStep("plan")}
                >
                  Change plan
                </button>
              </div>
              <p className="mt-4 text-sm text-[var(--pf-gray-500)]">
                Username is permanent and appears on your public track record. Email is used for
                alerts, recovery, and unlocking the workspace after payment.
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
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
                  Password
                </label>
                <PasswordInput
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
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
                  Promo code <span className="font-normal text-[var(--pf-gray-400)]">(optional)</span>
                </label>
                <Input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="LAUNCH20"
                  autoComplete="off"
                />
                {voucherHint ? (
                  <p className="mt-1 text-xs text-emerald-700">{voucherHint} applied at checkout.</p>
                ) : null}
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
                  !email.includes("@") ||
                  password.length < 8 ||
                  displayName.length < 2
                }
                onClick={handleRegister}
              >
                {loading
                  ? "Please wait…"
                  : stripeEnabled
                    ? `Pay ${selectedPlan.price}${selectedPlan.period} — Stripe checkout`
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
              <h2 className="text-2xl font-bold tracking-tight">Account created</h2>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                Username{" "}
                <span className="font-mono font-bold text-[var(--pf-black)]">@{username}</span> is
                reserved for {selectedPlan.name}.
                {stripeEnabled
                  ? " Complete checkout from sign-in if you weren't redirected."
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
  tagline,
  tier,
  features,
  highlight,
  selected,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  tagline: string;
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
          : "border-[var(--pf-border)] bg-[var(--pf-surface)] hover:border-[var(--pf-gray-300)]",
        highlight &&
          !selected &&
          "border-[var(--pf-red)]/40 bg-gradient-to-b from-[var(--pf-red-muted)] to-[var(--pf-surface)]"
      )}
    >
      {highlight ? (
        <span className="inline-block rounded-full bg-[var(--pf-red)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Best for research
        </span>
      ) : (
        <span className="inline-block rounded-full border border-[var(--pf-border)] bg-[var(--pf-surface)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-gray-500)]">
          Full workspace
        </span>
      )}
      <h3 className="mt-2 text-lg font-bold tracking-tight">{name}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">{tagline}</p>
      <p className="mt-3">
        <span className="text-3xl font-bold tracking-tight">{price}</span>
        <span className="text-[var(--pf-gray-500)]">{period}</span>
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-[var(--pf-gray-600)]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs font-semibold text-[var(--pf-red)]">
        {selected ? "Selected" : `Select ${tier === "pro" ? "Pro" : "Member"}`}
      </p>
    </button>
  );
}
