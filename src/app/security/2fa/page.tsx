"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [totpSecret, setTotpSecret] = useState("");
  const [qr, setQr] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/2fa-setup")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          if (d.error === "already_configured") {
            router.replace("/dashboard");
            return;
          }
          setError("Could not load authenticator setup.");
          return;
        }
        setTotpSecret(d.secret);
        setQr(d.qr);
      })
      .catch(() => setError("Could not load authenticator setup."));
  }, [router]);

  async function handleComplete() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, totpSecret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_totp"
            ? "Invalid code. Check your authenticator app and try again."
            : "Setup failed. Try again."
        );
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Secure your account"
      subtitle="Active membership requires two-factor authentication. Complete this once before using PortFuel."
    >
      <div className="space-y-6">
        {qr ? (
          <div className="flex justify-center rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-4 shadow-[var(--pf-shadow-sm)]">
            <Image src={qr} alt="TOTP QR code" width={200} height={200} unoptimized />
          </div>
        ) : (
          <div className="h-[232px] animate-pulse rounded-[var(--pf-radius-lg)] bg-[var(--pf-gray-100)]" />
        )}
        <p className="text-center text-sm text-[var(--pf-gray-500)]">
          Scan with Google Authenticator, Authy, or 1Password, then enter the 6-digit code.
        </p>
        <OtpInput value={token} onChange={setToken} disabled={loading} />
        {error ? (
          <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-center text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}
        <Button
          className="w-full"
          size="lg"
          disabled={loading || token.length !== 6 || !totpSecret}
          onClick={handleComplete}
        >
          {loading ? "Verifying…" : "Enable two-factor & continue"}
        </Button>
      </div>
    </AuthShell>
  );
}
