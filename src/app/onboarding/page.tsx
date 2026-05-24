"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <AuthShell
      title="Choose your display name"
      subtitle="This is how other members see you on calls and comments."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="displayName">Squad name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
            placeholder="e.g. FuelRunner"
            required
            minLength={2}
            autoFocus
          />
          <p className="mt-1.5 text-xs text-[var(--pf-gray-400)]">
            2–32 characters · you can change this later
          </p>
        </div>
        {error ? (
          <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading || displayName.length < 2}
        >
          {loading ? "Saving…" : "Continue to dashboard"}
        </Button>
      </form>
    </AuthShell>
  );
}
