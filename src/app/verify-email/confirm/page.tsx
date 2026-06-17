"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmailUnlockSteps } from "@/components/auth/EmailUnlockSteps";
import { Button } from "@/components/ui/button";

function ConfirmEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || token.length < 16) {
      setStatus("error");
      setError("Invalid or missing confirmation link.");
      return;
    }

    fetch("/api/auth/verify-email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(
            data.error === "expired"
              ? "This link has expired. Request a new one from the verify page."
              : data.error === "email_taken"
                ? "That email is already verified on another account."
                : "This confirmation link is invalid."
          );
          return;
        }
        setStatus("ok");
      })
      .catch(() => {
        setStatus("error");
        setError("Something went wrong.");
      });
  }, [token]);

  useEffect(() => {
    if (status !== "ok") return;
    const t = window.setTimeout(() => router.push("/onboarding"), 3500);
    return () => window.clearTimeout(t);
  }, [status, router]);

  return (
    <AuthShell
      title={
        status === "ok"
          ? "Email confirmed"
          : status === "loading"
            ? "Unlocking…"
            : "Confirmation failed"
      }
      subtitle={
        status === "ok"
          ? "Your email is verified. We recommend setting up 2FA next — you can also continue straight to the workspace."
          : undefined
      }
    >
      <div className="space-y-6">
        {status === "ok" ? <EmailUnlockSteps current="workspace" /> : null}

        <div className="space-y-6 text-center">
          {status === "loading" ? (
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
          ) : null}

          {status === "ok" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
              </div>
              <p className="text-sm font-medium text-[var(--pf-gray-700)]">
                <Sparkles className="mr-1 inline h-4 w-4 text-emerald-600" aria-hidden />
                Email unlocked — opening your workspace…
              </p>
              <div className="flex flex-col gap-2">
                <Button className="w-full" size="lg" onClick={() => router.push("/security/2fa")}>
                  Set up 2FA (recommended)
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/onboarding")}
                >
                  Continue to workspace
                </Button>
              </div>
            </>
          ) : null}

          {status === "error" ? (
            <>
              <p className="text-sm text-[var(--pf-red)]">{error}</p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/verify-email")}
              >
                Back to verify email
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </AuthShell>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Unlocking…">
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
          </div>
        </AuthShell>
      }
    >
      <ConfirmEmailInner />
    </Suspense>
  );
}
