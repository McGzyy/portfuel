"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";
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
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Logo className="mb-8" />

        {pending ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Your membership is pending activation. Stripe checkout coming soon — contact
            support if you need access.
          </div>
        ) : null}

        {step === "plan" && (
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">Join the Squad</h1>
              <p className="text-[var(--pf-gray-600)]">
                Premium stock call intelligence. Stripe billing wires in next phase — early
                members get full access during beta.
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
              <Button className="w-full" onClick={() => setStep("pin")}>
                Continue — claim your PortFuel ID
              </Button>
              <p className="text-center text-sm text-[var(--pf-gray-500)]">
                Already have an ID?{" "}
                <Link href="/login" className="text-[var(--pf-red)] hover:underline">
                  Login
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {step === "pin" && (
          <Card>
            <CardHeader>
              <h1 className="text-xl font-bold">Choose your PortFuel ID</h1>
              <p className="text-sm text-[var(--pf-gray-500)]">
                Your 5-digit ID is how you log in — like a username. Pick one that&apos;s easy
                to remember.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">PortFuel ID (5 digits)</label>
                <Input
                  inputMode="numeric"
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="12345"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Display name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
                  placeholder="Your squad name"
                />
              </div>
              <Button
                className="w-full"
                disabled={pin.length !== 5 || displayName.length < 2}
                onClick={() => setStep("totp")}
              >
                Set up authenticator
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "totp" && (
          <Card>
            <CardHeader>
              <h1 className="text-xl font-bold">Secure your account</h1>
              <p className="text-sm text-[var(--pf-gray-500)]">
                Scan with Google Authenticator, Authy, or 1Password.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {qr ? (
                <div className="flex justify-center">
                  <Image src={qr} alt="TOTP QR" width={220} height={220} unoptimized />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-medium">6-digit code</label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              {error ? <p className="text-sm text-[var(--pf-red)]">{error}</p> : null}
              <Button
                className="w-full"
                disabled={loading || token.length !== 6}
                onClick={handleRegister}
              >
                {loading ? "Creating account…" : "Complete registration"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card>
            <CardContent className="py-10 text-center">
              <h1 className="text-2xl font-bold text-[var(--pf-black)]">You&apos;re in.</h1>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                PortFuel ID <span className="font-mono font-bold">{pin}</span> is ready.
              </p>
              <Button className="mt-6" onClick={() => router.push("/login")}>
                Go to login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
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
      className={`rounded-xl border p-5 ${
        highlight ? "border-[var(--pf-red)] ring-1 ring-[var(--pf-red)]" : "border-[var(--pf-border)]"
      }`}
    >
      {highlight ? (
        <span className="text-xs font-bold uppercase text-[var(--pf-red)]">Popular</span>
      ) : null}
      <h3 className="mt-1 text-lg font-bold">{name}</h3>
      <p className="mt-2">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-[var(--pf-gray-500)]">{period}</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-[var(--pf-gray-600)]">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
    </div>
  );
}
