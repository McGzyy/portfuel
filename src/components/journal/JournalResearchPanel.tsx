"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_JOURNAL_RESEARCH_DISCLAIMER } from "@/lib/ai/config";
import type { JournalResearchResponse } from "@/lib/ai/journal-research-types";
import type { JournalResearchUsageStatus } from "@/lib/ai/journal-research-usage";

export function JournalResearchPanel({ symbol }: { symbol: string }) {
  const [usage, setUsage] = useState<JournalResearchUsageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JournalResearchResponse | null>(null);
  const [error, setError] = useState("");

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/journal-research");
      if (res.ok) setUsage(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  async function runResearch() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/watchlist/${encodeURIComponent(symbol)}/journal/research`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "quota_exceeded") {
          setError("Monthly research limit reached — try again next month.");
          if (data.usage) setUsage((u) => (u ? { ...u, ...data.usage, remaining: 0 } : u));
        } else if (data.error === "ai_not_configured") {
          setError("AI research is not configured in this environment.");
        } else {
          setError("Could not run research review.");
        }
        return;
      }
      setResult(data as JournalResearchResponse);
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
      setError("Could not run research review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pf-workspace-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" strokeWidth={2.25} />
            AI research assistant
          </p>
          <p className="mt-1 max-w-xl text-xs text-[var(--pf-gray-500)]">
            Stress-tests your private thesis — gaps to fill, questions to answer, and catalyst checks.
            Separate from call publish coach.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading || usage?.configured === false || (usage?.remaining ?? 0) <= 0}
          onClick={() => void runResearch()}
        >
          {loading ? "Analyzing…" : "Run research review"}
        </Button>
      </div>

      {usage ? (
        <p className="mt-2 text-[10px] text-[var(--pf-gray-500)]">
          {usage.configured
            ? `${usage.remaining}/${usage.limit} reviews left this month`
            : "AI not configured (OPENAI_API_KEY missing)"}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      {result ? (
        <div className="mt-4 space-y-4 border-t border-[var(--pf-border)] pt-4 text-sm">
          <p className="leading-relaxed text-[var(--pf-gray-800)]">{result.read}</p>

          <ResearchBlock title="Strengths" items={result.strengths} tone="emerald" />
          <ResearchBlock title="Research gaps" items={result.research_gaps} tone="amber" />
          <ResearchBlock title="Questions to answer" items={result.questions_to_answer} tone="indigo" />
          {result.catalyst_notes.length > 0 ? (
            <ResearchBlock title="Catalyst checks" items={result.catalyst_notes} tone="slate" />
          ) : null}
          {result.risk_prompts.length > 0 ? (
            <ResearchBlock title="Risk prompts" items={result.risk_prompts} tone="rose" />
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-[10px] leading-relaxed text-[var(--pf-gray-400)]">
        {AI_JOURNAL_RESEARCH_DISCLAIMER}
      </p>
    </section>
  );
}

function ResearchBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "indigo" | "slate" | "rose";
}) {
  const dot =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "indigo"
          ? "bg-indigo-500"
          : tone === "rose"
            ? "bg-rose-500"
            : "bg-[var(--pf-gray-400)]";

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-[var(--pf-gray-700)]">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
