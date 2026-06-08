"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRO_BILLING_HREF } from "@/lib/billing/upgrade-href";
import { AI_COACH_DISCLAIMER, AI_COACH_MONTHLY_LIMIT } from "@/lib/ai/config";
import type { ThesisCoachResponse } from "@/lib/ai/types";
import type { AiCoachUsageStatus } from "@/lib/ai/usage";
import { cn } from "@/lib/utils";

export type ThesisCoachDraft = {
  symbol: string;
  assetClass: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
  timeframeTag?: string | null;
};

function checklistLabel(
  key: "thesisClarity" | "riskDefinition" | "timeframeFit",
  value: string
) {
  const labels: Record<string, Record<string, string>> = {
    thesisClarity: { weak: "Weak", developing: "Developing", solid: "Solid" },
    riskDefinition: { missing: "Missing", partial: "Partial", clear: "Clear" },
    timeframeFit: { unclear: "Unclear", ok: "OK", "well-defined": "Well defined" },
  };
  return labels[key]?.[value] ?? value;
}

function checklistTone(value: string) {
  if (value === "solid" || value === "clear" || value === "well-defined") {
    return "text-emerald-700 bg-emerald-50";
  }
  if (value === "weak" || value === "missing" || value === "unclear") {
    return "text-rose-700 bg-rose-50";
  }
  return "text-amber-800 bg-amber-50";
}

export function ThesisCoachPanel({
  draft,
  isPro,
  showUpgrade,
}: {
  draft: () => ThesisCoachDraft;
  isPro: boolean;
  showUpgrade?: boolean;
}) {
  const [usage, setUsage] = useState<AiCoachUsageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [result, setResult] = useState<ThesisCoachResponse | null>(null);
  const [error, setError] = useState("");

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/thesis-coach");
      if (res.ok) setUsage(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  async function runCoach() {
    const d = draft();
    if (!d.symbol.trim() || d.thesis.trim().length < 10) {
      setError("Enter a symbol and at least 10 characters of thesis before coaching.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/thesis-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: d.symbol.trim().toUpperCase(),
          assetClass: d.assetClass,
          direction: d.direction,
          thesis: d.thesis.trim(),
          entryPrice: d.entryPrice ?? null,
          targetPrice: d.targetPrice ?? null,
          stopPrice: d.stopPrice ?? null,
          timeframeTag: d.timeframeTag?.trim() || null,
          includeHistory: isPro && includeHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "quota_exceeded") {
          setError(
            showUpgrade
              ? `You've used all ${data.usage?.limit ?? ""} Member reviews this month. Upgrade to Pro for 30/mo.`
              : "Monthly thesis coach limit reached. Resets next calendar month (UTC)."
          );
          if (data.usage) {
            setUsage((u) =>
              u
                ? {
                    ...u,
                    used: data.usage.used,
                    remaining: 0,
                  }
                : u
            );
          }
        } else if (data.error === "history_pro_only") {
          setError(data.message ?? "Track-record context requires Pro.");
        } else if (data.error === "ai_unavailable") {
          setError("Coach is temporarily unavailable. Try again shortly.");
        } else {
          setError("Could not run thesis coach.");
        }
        return;
      }
      setResult(data as ThesisCoachResponse);
      setUsage((u) =>
        u
          ? {
              ...u,
              used: data.usage.used,
              remaining: data.usage.remaining,
            }
          : u
      );
    } catch {
      setError("Could not run thesis coach.");
    } finally {
      setLoading(false);
    }
  }

  const remaining = usage?.remaining ?? 0;
  const configured = usage?.configured ?? false;

  return (
    <section className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Thesis coach
          </p>
          <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
            Educational feedback on structure, risk, and clarity — not buy/sell advice.
            {usage ? (
              <span className="block mt-1 text-xs text-[var(--pf-gray-500)]">
                {usage.remaining} of {usage.limit} reviews left this month
                {isPro ? " (Pro)" : " (Member)"}
                {!configured ? " · demo mode until OPENAI_API_KEY is set" : ""}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {isPro ? (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--pf-gray-700)]">
          <input
            type="checkbox"
            checked={includeHistory}
            onChange={(e) => setIncludeHistory(e.target.checked)}
            className="rounded border-[var(--pf-border)]"
          />
          Include my recent track record in context
        </label>
      ) : showUpgrade ? (
        <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
          Pro adds track-record context and {AI_COACH_MONTHLY_LIMIT.pro} reviews/month vs{" "}
          {AI_COACH_MONTHLY_LIMIT.member} on Member.{" "}
          <Link href={PRO_BILLING_HREF} className="font-semibold text-[var(--pf-red)] hover:underline">
            Upgrade to Pro
          </Link>
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading || remaining <= 0}
          onClick={() => void runCoach()}
        >
          {loading ? "Analyzing…" : "Review my thesis"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {result ? (
        <div className="pf-workspace-panel mt-5 space-y-4 p-4">
          <p className="text-sm leading-relaxed text-[var(--pf-gray-700)]">{result.review.summary}</p>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["Clarity", result.review.checklist.thesisClarity],
                ["Risk", result.review.checklist.riskDefinition],
                ["Timeframe", result.review.checklist.timeframeFit],
              ] as const
            ).map(([label, val]) => (
              <span
                key={label}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  checklistTone(val)
                )}
              >
                {label}: {checklistLabel(
                  label === "Clarity"
                    ? "thesisClarity"
                    : label === "Risk"
                      ? "riskDefinition"
                      : "timeframeFit",
                  val
                )}
              </span>
            ))}
          </div>

          <CoachList title="Strengths" items={result.review.strengths} />
          <CoachList title="Risks & gaps" items={result.review.risks} />
          <CoachList title="Questions to ask yourself" items={result.review.questionsToAsk} />

          {result.historyIncluded ? (
            <p className="text-xs text-[var(--pf-gray-500)]">
              Included your recent published calls as context.
            </p>
          ) : null}

          <p className="text-[11px] leading-relaxed text-[var(--pf-gray-400)]">
            {result.disclaimer || AI_COACH_DISCLAIMER}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function CoachList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {title}
      </p>
      <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-[var(--pf-gray-700)]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
