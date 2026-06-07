"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmailUnlockSteps } from "@/components/auth/EmailUnlockSteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VerifyStatus = {
  email: string | null;
  emailVerified: boolean;
  stripeCheckoutEmail: string | null;
  mismatch: boolean;
  emailConfigured?: boolean;
};

function VerifyEmailFallback() {
  return (
    <AuthShell title="Unlock your workspace">
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    </AuthShell>
  );
}

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";

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
    return data as VerifyStatus;
  }, [router]);

  useEffect(() => {
    load().catch(() => setError("Could not load verification status."));
  }, [load]);

  useEffect(() => {
    if (!welcome || !status?.emailConfigured) return;
    if (status.emailVerified || !email.includes("@")) return;
    setMessage("We sent a confirmation link to your inbox. Open it once to unlock the next step.");
  }, [welcome, status, email]);

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
              ? "Email could not be sent. Check RESEND_API_KEY and EMAIL_FROM in production."
              : "Could not send verification email.";
        setError(msg);
        return;
      }
      setMessage("Check your inbox — tap Unlock my workspace in the email (valid 24 hours).");
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
      setMessage("Confirmation link sent. Open your email to unlock the workspace.");
      await load();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const emailConfigured = status?.emailConfigured !== false;

  return (
    <AuthShell
      title="Unlock your workspace"
      subtitle="Membership is active. Confirm your email once — then 2FA opens the dashboard."
    >
      <div className="space-y-6">
        <EmailUnlockSteps current="email" />

        <div className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-gradient-to-b from-white to-[var(--pf-gray-50)] px-4 py-4 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
            <Mail className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--pf-black)]">
            Email is the key
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
            Alerts, password recovery, and your member identity all use this address. We never
            share it.
          </p>
        </div>

        {!emailConfigured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            Email delivery is not configured in this environment. Verification is skipped in
            dev — set RESEND_API_KEY, EMAIL_FROM, and NEXT_PUBLIC_APP_URL to test the full flow.
          </div>
        ) : null}

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
        ) : emailConfigured ? (
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
              className="w-full gap-2"
              size="lg"
              disabled={loading || !email.includes("@")}
              onClick={() => sendVerification()}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {loading ? "Sending…" : welcome ? "Resend unlock link" : "Send unlock link"}
            </Button>
          </>
        ) : null}

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
          Wrong address? Update it above and send a new link.
        </p>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
