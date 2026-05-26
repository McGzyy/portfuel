"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    username.trim().length >= 3 && password.length >= 8 && (!needsTotp || token.length === 6);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          token: needsTotp ? token : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "totp_required" || data.requiresTotp) {
          setNeedsTotp(true);
          setError("Enter the 6-digit code from your authenticator app.");
          return;
        }
        setError(
          data.error === "rate_limited"
            ? "Too many attempts. Try again in 15 minutes."
            : "Invalid username, password, or authenticator code."
        );
        return;
      }
      if (data.needsTwoFactorSetup) {
        router.push("/security/2fa");
      } else if (data.needsOnboarding) {
        router.push("/onboarding");
      } else if (data.subscriptionStatus === "pending" && data.role !== "admin") {
        router.push("/join?pending=1");
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
      subtitle="Use your username and password. Active members also need an authenticator code."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
            Username
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="your_username"
            autoComplete="username"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-[var(--pf-gray-400)]">Set at signup — cannot be changed.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        {needsTotp ? (
          <div>
            <p className="mb-4 text-center text-sm font-medium text-[var(--pf-gray-700)]">
              Authenticator code
            </p>
            <OtpInput value={token} onChange={setToken} disabled={loading} />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-center text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !canSubmit}>
          {loading ? "Signing in…" : needsTotp ? "Verify & sign in" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--pf-gray-500)]">
        New here?{" "}
        <Link href="/join" className="font-semibold text-[var(--pf-red)] hover:underline">
          {COPY.ctaGetAccess}
        </Link>
      </p>
    </AuthShell>
  );
}
