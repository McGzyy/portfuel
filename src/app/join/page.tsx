"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { COPY } from "@/lib/copy";

type Step = "plan" | "account" | "done";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pending = searchParams.get("pending") === "1";

  const [step, setStep] = useState<Step>("plan");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "username_taken"
            ? "That username is taken. Choose another."
            : data.message ?? "Registration failed. Check your details."
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
      <div className="border-b border-[var(--pf-border)] bg-white px-4 py-5 shadow-[var(--pf-shadow-sm)]">
        <div className="mx-auto flex max-w-3xl justify-center">
          <Logo size="lg" />
        </div>
      </div>
      <div className="pf-hero-mesh border-b border-[var(--pf-border)] py-10 text-center">
        <p className="pf-eyebrow">Membership</p>
        <h1 className="pf-display mt-3 text-2xl sm:text-3xl">Get inside access to PortFuel</h1>
        <p className="pf-lead mx-auto mt-3 max-w-md text-sm">
          Member-only theses, live marks, and the full feed — not just public winners. Choose a
          permanent username; after activation, complete 2FA to enter.
        </p>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {pending ? (
          <div className="mb-6 rounded-[var(--pf-radius-lg)] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[var(--pf-shadow-sm)]">
            Your membership is pending activation. Once an admin activates your account (or Stripe
            checkout ships), sign in and complete two-factor authentication to continue.
          </div>
        ) : null}

        {step === "plan" && (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <p className="pf-eyebrow">Membership</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">Member access</h1>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                Unlock the full thesis feed and live intel. Username is permanent — choose
                carefully.
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
              <Button className="w-full" size="lg" onClick={() => setStep("account")}>
                Create your account
              </Button>
              <p className="text-center text-sm text-[var(--pf-gray-500)]">
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-[var(--pf-red)] hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        )}

        {step === "account" && (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardHeader>
              <h1 className="text-xl font-bold tracking-tight">Account details</h1>
              <p className="mt-1.5 text-sm text-[var(--pf-gray-500)]">
                Username cannot be changed later. Use lowercase letters, numbers, and underscores.
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
                  username.length < 3 ||
                  password.length < 8 ||
                  displayName.length < 2
                }
                onClick={handleRegister}
              >
                {loading ? "Creating account…" : "Create account"}
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

        {step === "done" && (
          <Card className="pf-card-elevated border-0 shadow-[var(--pf-shadow-lg)]">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Account created</h1>
              <p className="mt-2 text-[var(--pf-gray-600)]">
                Username{" "}
                <span className="font-mono font-bold text-[var(--pf-black)]">@{username}</span> is
                reserved. Sign in after your membership is activated, then complete 2FA setup.
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
