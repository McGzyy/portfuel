"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_HELP_ASSISTANT_DISCLAIMER } from "@/lib/ai/config";
import type { HelpAssistantUsageStatus } from "@/lib/ai/help-assistant-usage";
import { PRO_BILLING_HREF } from "@/lib/billing/upgrade-href";
import { helpSectionHref } from "@/lib/help/content";
import { cn } from "@/lib/utils";

type HelpAssistantApiState = {
  usage: HelpAssistantUsageStatus;
  unlocked: boolean;
};

type Turn = {
  question: string;
  answer: string;
};

export function HelpAssistantPanel({ className }: { className?: string }) {
  const [state, setState] = useState<HelpAssistantApiState | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/help-assistant");
      if (res.ok) setState(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function ask() {
    const q = question.trim();
    if (q.length < 4) {
      setError("Enter at least 4 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/help-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "pro_required") {
          setError("Ask AI is included with Pro.");
        } else if (data.error === "limit_reached") {
          setError("Monthly question limit reached — resets next calendar month (UTC).");
          if (data.usage && state) {
            setState({ ...state, usage: { ...state.usage, ...data.usage, remaining: 0 } });
          }
        } else if (data.error === "not_configured") {
          setError("Help assistant is not configured in this environment.");
        } else {
          setError("Could not get an answer. Try again or open a support ticket.");
        }
        return;
      }

      setTurns((prev) => [...prev, { question: q, answer: data.answer as string }]);
      setQuestion("");
      if (state && data.usage) {
        setState({
          ...state,
          usage: { ...state.usage, ...data.usage, remaining: data.remaining ?? data.usage.remaining },
        });
      }
    } catch {
      setError("Could not get an answer. Try again or open a support ticket.");
    } finally {
      setLoading(false);
    }
  }

  const unlocked = state?.unlocked ?? false;
  const usage = state?.usage;
  const remaining = usage?.remaining ?? 0;

  return (
    <section
      className={cn(
        "pf-workspace-panel overflow-hidden p-0",
        className
      )}
    >
      <div className="border-b border-[var(--pf-border)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Ask AI
            </p>
            <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
              Product questions about PortFuel — billing, features, navigation. Not investment advice.
              {usage ? (
                <span className="mt-1 block text-xs text-[var(--pf-gray-500)]">
                  {unlocked
                    ? `${remaining} of ${usage.limit} questions left this month`
                    : "Pro members only"}
                  {!usage.configured ? " · unavailable until AI is configured" : ""}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-sm text-[var(--pf-gray-600)]">
            Ask AI is a Pro perk — instant answers from our help docs.{" "}
            <Link href={PRO_BILLING_HREF} className="font-semibold text-[var(--pf-red)] hover:underline">
              Upgrade to Pro
            </Link>{" "}
            or browse the docs below.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="sr-only" htmlFor="help-assistant-question">
              Ask about PortFuel
            </label>
            <textarea
              id="help-assistant-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              disabled={loading || remaining <= 0}
              placeholder="e.g. How do I export my track record?"
              className="w-full resize-none rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--pf-gray-400)] focus:border-[var(--pf-gray-300)] disabled:opacity-60"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={loading || remaining <= 0 || question.trim().length < 4}
                onClick={() => void ask()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Thinking…
                  </>
                ) : (
                  <>
                    <MessageCircleQuestion className="mr-1.5 h-3.5 w-3.5" />
                    Ask
                  </>
                )}
              </Button>
              <Link
                href={helpSectionHref("troubleshooting", "tickets")}
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--foreground)]"
              >
                Need account help? Open a ticket
              </Link>
            </div>
            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
          </div>
        )}
      </div>

      {turns.length > 0 ? (
        <div className="space-y-0 divide-y divide-[var(--pf-border)] px-4 py-2 sm:px-5">
          {turns.map((turn, i) => (
            <div key={`${turn.question.slice(0, 24)}-${i}`} className="py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                You asked
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{turn.question}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Answer
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--pf-gray-600)]">
                {turn.answer}
              </p>
            </div>
          ))}
          <p className="py-3 text-[11px] leading-relaxed text-[var(--pf-gray-500)]">
            {AI_HELP_ASSISTANT_DISCLAIMER}
          </p>
        </div>
      ) : unlocked ? (
        <p className="px-4 pb-4 text-[11px] leading-relaxed text-[var(--pf-gray-500)] sm:px-5">
          {AI_HELP_ASSISTANT_DISCLAIMER}
        </p>
      ) : null}
    </section>
  );
}
