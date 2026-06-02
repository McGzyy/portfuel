"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export default function JoinSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [needs2fa, setNeeds2fa] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Missing checkout session. Contact support if you were charged.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(
            data.error === "payment_incomplete"
              ? "Payment is still processing. Refresh in a minute or sign in once it clears."
              : "Could not confirm membership. Sign in — if your plan is active, continue to 2FA."
          );
          return;
        }

        setNeeds2fa(Boolean(data.needsTwoFactorSetup));
        setNeedsEmail(Boolean(data.needsEmailVerification));
        setStatus("ok");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Network error confirming payment. Try signing in.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[var(--pf-gray-50)]">
      <div className="border-b border-[var(--pf-border)] bg-white px-4 py-5">
        <div className="mx-auto flex max-w-lg justify-center">
          <Logo size="lg" />
        </div>
      </div>
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--pf-red)]" />
            <h1 className="mt-6 text-xl font-bold">Activating membership…</h1>
            <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
              Confirming your subscription with Stripe.
            </p>
          </>
        ) : null}

        {status === "ok" ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <h1 className="mt-6 text-2xl font-bold">Payment received</h1>
            <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
              Your membership is active. One quick step left: confirm your email, then set up 2FA
              to open the workspace.
            </p>
            <Button
              className="mt-8"
              size="lg"
              onClick={() => {
                if (needsEmail) router.push("/verify-email");
                else if (needs2fa) router.push("/security/2fa");
                else router.push("/dashboard");
              }}
            >
              {needsEmail
                ? "Confirm email"
                : needs2fa
                  ? "Set up 2FA"
                  : "Continue"}
            </Button>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <h1 className="text-xl font-bold text-[var(--pf-black)]">
              Confirmation issue
            </h1>
            <p className="mt-2 text-sm text-[var(--pf-gray-600)]">{errorMsg}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full" size="lg">
                  Sign in
                </Button>
              </Link>
              <Link href="/join?pending=1">
                <Button variant="secondary" className="w-full">
                  Back to join
                </Button>
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
