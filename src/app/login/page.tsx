"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { PinPad } from "@/components/auth/PinPad";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = pin.length === 5 && token.length === 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "rate_limited"
            ? "Too many attempts. Try again in 15 minutes."
            : "Invalid PortFuel ID or authenticator code."
        );
        return;
      }
      if (data.needsDisplayName) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Enter your 5-digit PortFuel ID, then your authenticator code."
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <p className="mb-4 text-center text-sm font-medium text-[var(--pf-gray-700)]">
            PortFuel ID
          </p>
          <PinPad value={pin} onChange={setPin} disabled={loading} />
        </div>

        <div>
          <p className="mb-4 text-center text-sm font-medium text-[var(--pf-gray-700)]">
            Authenticator code
          </p>
          <OtpInput value={token} onChange={setToken} disabled={loading} />
        </div>

        {error ? (
          <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-center text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !canSubmit}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--pf-gray-500)]">
        New here?{" "}
        <Link href="/join" className="font-semibold text-[var(--pf-red)] hover:underline">
          Join the Squad
        </Link>
      </p>
    </AuthShell>
  );
}
