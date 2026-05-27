"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_MAX_SYMBOLS,
  ONBOARDING_MIN_SYMBOLS,
  ONBOARDING_TOUR_STEPS,
} from "@/lib/onboarding/constants";

type Step = "name" | "watchlist" | "tour";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [needsDisplayName, setNeedsDisplayName] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [tourIndex, setTourIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding");
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load onboarding.");
        return;
      }
      if (data.completed) {
        router.replace("/dashboard");
        return;
      }
      setNeedsDisplayName(Boolean(data.needsDisplayName));
      setSuggestions((data.suggestions as string[]) ?? []);
      setStep(data.needsDisplayName ? "name" : "watchlist");
      if (!data.needsDisplayName && (data.suggestions as string[])?.length) {
        setSelected((data.suggestions as string[]).slice(0, 3));
      }
    } catch {
      setError("Could not load onboarding.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleSymbol(sym: string) {
    setSelected((prev) => {
      if (prev.includes(sym)) return prev.filter((s) => s !== sym);
      if (prev.length >= ONBOARDING_MAX_SYMBOLS) return prev;
      return [...prev, sym];
    });
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: needsDisplayName ? displayName.trim() : undefined,
          symbols: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "symbols_required"
            ? `Pick at least ${ONBOARDING_MIN_SYMBOLS} symbol.`
            : "Could not finish onboarding. Try again."
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AuthShell title="Setting up your workspace" subtitle="One moment…">
        <p className="text-center text-sm text-[var(--pf-gray-500)]">Loading…</p>
      </AuthShell>
    );
  }

  if (step === "name") {
    return (
      <AuthShell
        title="Choose your display name"
        subtitle="Step 1 of 3 — how other members see you on calls and comments."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (displayName.trim().length < 2) return;
            setStep("watchlist");
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
              placeholder="e.g. FuelRunner"
              required
              minLength={2}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-[var(--pf-gray-400)]">2–32 characters</p>
          </div>
          {error ? (
            <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" size="lg" disabled={displayName.length < 2}>
            Continue
          </Button>
        </form>
      </AuthShell>
    );
  }

  if (step === "watchlist") {
    return (
      <AuthShell
        title="Seed your watchlist"
        subtitle={`Step ${needsDisplayName ? 2 : 1} of 3 — pick ${ONBOARDING_MIN_SYMBOLS}–${ONBOARDING_MAX_SYMBOLS} symbols to track. You’ll get alerts when members call them.`}
      >
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sym) => {
            const on = selected.includes(sym);
            return (
              <button
                key={sym}
                type="button"
                onClick={() => toggleSymbol(sym)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-sm font-semibold transition-colors",
                  on
                    ? "border-[var(--pf-red)] bg-[var(--pf-red-muted)] text-[var(--pf-red)]"
                    : "border-[var(--pf-border)] bg-white text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-400)]"
                )}
              >
                {sym}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
          {selected.length} selected · add more anytime from Watchlist
        </p>
        {error ? (
          <p className="mt-4 rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={selected.length < ONBOARDING_MIN_SYMBOLS}
            onClick={() => setStep("tour")}
          >
            Continue
          </Button>
          {needsDisplayName ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("name")}>
              Back
            </Button>
          ) : null}
        </div>
      </AuthShell>
    );
  }

  const tour = ONBOARDING_TOUR_STEPS[tourIndex];
  const TourIcon = tour.icon;
  const isLastTour = tourIndex === ONBOARDING_TOUR_STEPS.length - 1;

  return (
    <AuthShell
      title="Quick tour"
      subtitle={`${tourIndex + 1} of ${ONBOARDING_TOUR_STEPS.length} — quick tour`}
    >
      <div className="rounded-xl border border-[var(--pf-border)] bg-white p-5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
          <TourIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 text-base font-bold text-[var(--pf-black)]">{tour.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">{tour.body}</p>
        <Link
          href={tour.href}
          className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Open {tour.title} →
        </Link>
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {ONBOARDING_TOUR_STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-6 rounded-full",
              i === tourIndex ? "bg-[var(--pf-red)]" : "bg-[var(--pf-border)]"
            )}
          />
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        {!isLastTour ? (
          <Button type="button" size="lg" className="w-full" onClick={() => setTourIndex((i) => i + 1)}>
            Next
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={saving || selected.length < ONBOARDING_MIN_SYMBOLS}
            onClick={() => void finish()}
          >
            {saving ? "Finishing…" : "Enter workspace"}
          </Button>
        )}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (tourIndex > 0 ? setTourIndex((i) => i - 1) : setStep("watchlist"))}
          >
            Back
          </Button>
          {!isLastTour ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void finish()}>
              Skip tour
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-[var(--pf-gray-400)]">
        <BarChart3 className="h-3 w-3" />
        Not investment advice · community intelligence only
      </p>
    </AuthShell>
  );
}
