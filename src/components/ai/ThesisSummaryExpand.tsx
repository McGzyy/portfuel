"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AI_SUMMARY_DISCLAIMER } from "@/lib/ai/config";

export function ThesisSummaryExpand({
  callId,
  canGenerate,
  showUpgrade,
}: {
  callId: string;
  canGenerate: boolean;
  showUpgrade?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (summary) {
      setOpen((o) => !o);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/thesis-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "pro_required") {
          setError(
            showUpgrade
              ? "Pro generates quick summaries for the feed. Upgrade to unlock — cached summaries are free to read once created."
              : (data.message as string) ?? "Pro required to generate summaries."
          );
        } else if (data.error === "quota_exceeded") {
          setError("Monthly summary generation limit reached. Cached summaries still load.");
        } else {
          setError("Summary unavailable.");
        }
        setOpen(true);
        return;
      }
      setSummary(data.summaryLine as string);
      setCached(Boolean(data.cached));
      setOpen(true);
    } catch {
      setError("Summary unavailable.");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-red)]"
      >
        <Sparkles className="h-3 w-3" />
        {loading ? "Loading…" : open && summary ? "Hide summary" : "Quick summary"}
        {canGenerate && !summary ? (
          <span className="font-normal text-[var(--pf-gray-400)]"> · Pro</span>
        ) : null}
      </button>

      {open && summary ? (
        <div className="mt-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            AI skim {cached ? "· saved" : "· new"}
          </p>
          <p className="mt-1 text-sm leading-snug text-[var(--pf-gray-800)]">{summary}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--pf-gray-400)]">
            {AI_SUMMARY_DISCLAIMER}
          </p>
        </div>
      ) : null}

      {open && error ? (
        <p className="mt-2 text-xs text-[var(--pf-gray-600)]">
          {error}{" "}
          {showUpgrade ? (
            <Link href="/profile" className="font-semibold text-[var(--pf-red)] hover:underline">
              Upgrade to Pro
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
