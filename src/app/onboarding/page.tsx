"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        setError("Could not save display name.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--pf-gray-50)] px-4">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-bold">Choose your display name</h1>
          <p className="text-sm text-[var(--pf-gray-500)]">
            This is how other members see you on calls and comments.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
              placeholder="e.g. FuelRunner"
              required
              minLength={2}
            />
            {error ? <p className="text-sm text-[var(--pf-red)]">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              Continue to dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
