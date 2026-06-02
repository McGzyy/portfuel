"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
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

  return (
    <AuthShell
      title={status === "ok" ? "Email confirmed" : status === "loading" ? "Confirming…" : "Confirmation failed"}
      subtitle={
        status === "ok"
          ? "Your email is verified. Set up two-factor authentication next."
          : undefined
      }
    >
      <div className="space-y-6 text-center">
        {status === "loading" ? (
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
        ) : null}
        {status === "error" ? (
          <p className="text-sm text-[var(--pf-red)]">{error}</p>
        ) : null}
        {status === "ok" ? (
          <Button className="w-full" size="lg" onClick={() => router.push("/security/2fa")}>
            Set up 2FA
          </Button>
        ) : null}
        {status === "error" ? (
          <Button className="w-full" variant="outline" onClick={() => router.push("/verify-email")}>
            Back to verify email
          </Button>
        ) : null}
      </div>
    </AuthShell>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Confirming…">
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
