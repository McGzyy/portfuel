"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { PinPad } from "@/components/auth/PinPad";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Step = "plan" | "pin" | "totp" | "done";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = searchParams.get("pending") === "1";

  const [step, setStep] = useState<Step>("plan");
  const [pin, setPin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [qr, setQr] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === "totp" && pin.length === 5 && !totpSecret) {
      fetch(`/api/auth/totp-setup?pin=${pin}`)
        .then((r) => r.json())
        .then((d) => {
          setTotpSecret(d.secret);
          setQr(d.qr);
        })
        .catch(() => setError("Could not load authenticator setup."));
    }
  }, [step, pin, totpSecret]);

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, displayName, token, totpSecret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "pin_taken"
            ? "That PortFuel ID is taken. Choose another."
            : "Registration failed. Check your authenticator code."
        );
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
      <div className="border-b border-[var(--pf-border)] bg-white px-4 py-4 shadow-[var(--pf-shadow-sm)]">
        <div className="mx-auto flex max-w-3xl justify-center">
          <Logo />
        </div>
      </div>
      <div className="pf-hero-mesh border-b border-[var(--pf-border)] py-10 text-center">
        <p className="pf-eyebrow">Membership</p>
        <h1 className="pf-display mt-3 text-2xl sm:text-3xl">Join the PortFuel squad</h1>
        <p className="pf-lead mx-auto mt-3 max-w-md text-sm">
          Professional call tracking with PIN + authenticator security.
        </p>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">

        {pending ? (
          <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[var(--pf-shadow-sm)]">
            Your membership is pending activation. Stripe checkout coming soon — contact
            support if you need access.
          </div>
        ) : null}

        {step === "plan" && (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <p className="pf-eyebrow">Membership</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">Join the Squad</h1>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                Premium stock call intelligence. Early members get full access during beta.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <PlanCard
                  name="Member"
                  price="$49"
                  period="/mo"
                  features={[
                    "Public & private call feeds",
                    "Live charts with call markers",
                    "Performance tracking",
                    "2 calls per week (new members)",
                  ]}
                />
                <PlanCard
                  name="Pro"
                  price="$99"
                  period="/mo"
                  highlight
                  features={[
                    "Everything in Member",
                    "Higher submission limits",
                    "Priority feed placement",
                    "Trusted track eligibility",
                  ]}
                />
              </div>
              <Button className="w-full" size="lg" onClick={() => setStep("pin")}>
                Continue — claim your PortFuel ID
              </Button>
              <p className="text-center text-sm text-[var(--pf-gray-500)]">
                Already have an ID?{" "}
                <Link href="/login" className="font-semibold text-[var(--pf-red)] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {step === "pin" && (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <StepIndicator current={1} total={2} label="Account setup" />
              <h1 className="mt-3 text-xl font-bold tracking-tight">Choose your PortFuel ID</h1>
              <p className="mt-1.5 text-sm text-[var(--pf-gray-500)]">
                Your 5-digit ID is how you sign in — pick something memorable.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <PinPad value={pin} onChange={setPin} />
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
                  Display name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
                  placeholder="Your squad name"
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={pin.length !== 5 || displayName.length < 2}
                onClick={() => setStep("totp")}
              >
                Set up authenticator
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
        )}

        {step === "totp" && (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <StepIndicator current={2} total={2} label="Security" />
              <h1 className="mt-3 text-xl font-bold tracking-tight">Secure your account</h1>
              <p className="mt-1.5 text-sm text-[var(--pf-gray-500)]">
                Scan with Google Authenticator, Authy, or 1Password.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {qr ? (
                <div className="flex justify-center rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-4 shadow-[var(--pf-shadow-sm)]">
                  <Image src={qr} alt="TOTP QR code" width={200} height={200} unoptimized />
                </div>
              ) : (
                <div className="h-[232px] animate-pulse rounded-[var(--pf-radius-lg)] bg-[var(--pf-gray-100)]" />
              )}
              <div>
                <p className="mb-4 text-center text-sm font-medium text-[var(--pf-gray-700)]">
                  Enter the 6-digit code from your app
                </p>
                <OtpInput value={token} onChange={setToken} disabled={loading} />
              </div>
              {error ? (
                <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-center text-sm text-[var(--pf-red)]">
                  {error}
                </p>
              ) : null}
              <Button
                className="w-full"
                size="lg"
                disabled={loading || token.length !== 6}
                onClick={handleRegister}
              >
                {loading ? "Creating account…" : "Complete registration"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
                onClick={() => {
                  setStep("pin");
                  setToken("");
                  setTotpSecret("");
                  setQr("");
                }}
              >
                ← Change PortFuel ID
              </button>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">You&apos;re in.</h1>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                PortFuel ID{" "}
                <span className="font-mono text-lg font-bold text-[var(--pf-black)]">{pin}</span>{" "}
                is ready.
              </p>
              <Button className="mt-8" size="lg" onClick={() => router.push("/login")}>
                Go to sign in
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--pf-red)]">
        {label}
      </span>
      <span className="text-xs text-[var(--pf-gray-400)]">
        Step {current} of {total}
      </span>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--pf-radius-lg)] border p-5 transition-shadow ${
        highlight
          ? "border-[var(--pf-red)] bg-gradient-to-b from-[var(--pf-red-muted)] to-white shadow-[var(--pf-shadow-md)] ring-1 ring-[var(--pf-red)]/20"
          : "border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]"
      }`}
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
    </div>
  );
}
