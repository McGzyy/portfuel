"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
            : "Invalid PIN or authenticator code."
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--pf-gray-50)] px-4">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-bold">Login</h1>
          <p className="text-sm text-[var(--pf-gray-500)]">
            Enter your 5-digit PortFuel ID and authenticator code.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">PortFuel ID</label>
              <Input
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                placeholder="12345"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Authenticator code</label>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            {error ? <p className="text-sm text-[var(--pf-red)]">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--pf-gray-500)]">
            New here?{" "}
            <Link href="/join" className="font-medium text-[var(--pf-red)] hover:underline">
              Join the Squad
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
