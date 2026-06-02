"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VerifyStatus = {
  email: string | null;
  emailVerified: boolean;
  stripeCheckoutEmail: string | null;
  mismatch: boolean;
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/verify-email");
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "unauthorized") {
        router.replace("/login");
        return;
      }
      setError("Could not load verification status.");
      return;
    }
    setStatus(data);
    setEmail(data.email ?? data.stripeCheckoutEmail ?? "");
    if (data.emailVerified) {
      router.replace("/security/2fa");
    }
  }, [router]);

  useEffect(() => {
    load().catch(() => setError("Could not load verification status."));
  }, [load]);

  async function sendVerification(targetEmail?: string) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail ?? email }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.error === "email_taken"
            ? "That email is already verified on another account."
            : data.error === "send_failed"
              ? "Email could not be sent. Check RESEND_API_KEY."
              : "Could not send verification email.";
        setError(msg);
        return;
      }
      setMessage("Check your inbox for a confirmation link (valid 24 hours).");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseSource(source: "stripe" | "entered") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Could not apply email choice.");
        return;
      }
      setEmail(data.email ?? email);
      setMessage("Verification email sent to the address you selected.");
      await load();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Confirm your email"
      subtitle="Payment is complete. Verify your email once, then set up two-factor authentication to open the workspace."
    >
      <div className="space-y-5">
        {status?.mismatch ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <p className="font-medium">Two different emails were found</p>
            <p className="mt-1 text-amber-800">
              Signup: <strong>{status.email}</strong>
              <br />
              Stripe checkout: <strong>{status.stripeCheckoutEmail}</strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => chooseSource("entered")}
              >
                Use signup email
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={() => chooseSource("stripe")}
              >
                Use Stripe email
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
                Email address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={loading || !email.includes("@")}
              onClick={() => sendVerification()}
            >
              {loading ? "Sending…" : "Send confirmation link"}
            </Button>
          </>
        )}

        {error ? (
          <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-center text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        <p className="text-center text-xs text-[var(--pf-gray-500)]">
          Already confirmed?{" "}
          <button
            type="button"
            className="font-semibold text-[var(--pf-red)] hover:underline"
            onClick={() => router.push("/security/2fa")}
          >
            Continue to 2FA
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
