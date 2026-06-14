"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedUsername = username.trim().toLowerCase();
  const isAdminLogin = normalizedUsername === "admin";
  const totpRequired = needsTotp || isAdminLogin;

  const subtitle = useMemo(() => {
    if (isAdminLogin) {
      return "Admin: password plus the 6-digit code from your authenticator app (not values from .env).";
    }
    if (totpRequired) {
      return "Enter your password and the 6-digit code from your authenticator app.";
    }
    return "Username and password. Add your authenticator code too if you use 2FA.";
  }, [isAdminLogin, totpRequired]);

  const canSubmit =
    normalizedUsername.length >= 3 &&
    password.trim().length >= 8 &&
    (!totpRequired || token.length === 6);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    const trimmedPassword = password.trim();
    const totpToken = token.replace(/\s/g, "");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          username: normalizedUsername,
          password: trimmedPassword,
          token: totpToken.length >= 6 ? totpToken : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "totp_required" || data.requiresTotp) {
          setNeedsTotp(true);
          setError("Enter the 6-digit code from your authenticator app.");
          return;
        }
        if (data.error === "rate_limited") {
          setError("Too many attempts. Try again in 15 minutes.");
          return;
        }
        if (data.error === "invalid_totp") {
          setNeedsTotp(true);
          setError(
            isAdminLogin
              ? "Wrong authenticator code. Use the PortFuel admin entry in your app — if needed, reset with scripts/reset-admin-totp.mjs using production .env."
              : "Authenticator code is incorrect or expired. Try the latest code."
          );
          return;
        }
        if (data.error === "totp_setup_error") {
          setError(
            "Server could not read your authenticator setup. Ensure TOTP_ENCRYPTION_KEY on Vercel matches when admin 2FA was set, or run reset-admin-totp.mjs against production."
          );
          return;
        }
        if (data.error === "account_banned") {
          setError("This account has been suspended.");
          return;
        }
        if (data.error === "invalid_password") {
          setError("Incorrect password.");
          return;
        }
        if (data.error === "invalid_input") {
          setError("Check your username, password, and 6-digit code.");
          return;
        }
        setError(
          isAdminLogin
            ? "No matching admin account or password in the database. .env ADMIN_PASSWORD is only for setup — run: npm run admin:sync (see package.json)."
            : "Invalid username or password."
        );
        return;
      }
      if (data.needsEmailVerification) {
        router.push("/verify-email?welcome=1");
      } else if (data.needsTwoFactorSetup) {
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
    <AuthShell title="Sign in" subtitle={subtitle}>
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-[var(--pf-gray-400)]">Set at signup — cannot be changed.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--pf-gray-700)]">
            Password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
          <p className="mt-2 text-right text-xs">
            <Link href="/forgot-password" className="text-[var(--pf-red)] hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        <div>
          <label className="mb-3 block text-center text-sm font-medium text-[var(--pf-gray-700)]">
            Authenticator code{totpRequired ? "" : " (if enabled)"}
          </label>
          <div className="hidden sm:block">
            <OtpInput value={token} onChange={setToken} disabled={loading} />
          </div>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-base tracking-[0.35em] sm:hidden"
            disabled={loading}
            aria-label="Authenticator code"
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-center text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !canSubmit}>
          {loading ? "Signing in…" : totpRequired ? "Verify & sign in" : "Sign in"}
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
