"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  JOURNAL_CATALYST_OPTIONS,
  JOURNAL_OUTCOMES,
  parseTagsInput,
  type JournalCatalyst,
  type JournalOutcome,
  type PositionIntent,
} from "@/lib/watchlist/journal-meta";
import { POSITION_INTENT_OPTIONS } from "@/lib/watchlist/position-intent";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";
import type { JournalResearchUsageStatus } from "@/lib/ai/journal-research-usage";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

export function WatchlistJournalPlanForm({
  symbol,
  initial,
  onSaved,
}: {
  symbol: string;
  initial: WatchlistJournal;
  onSaved: (journal: WatchlistJournal) => void;
}) {
  const [thesis, setThesis] = useState(initial.thesis ?? "");
  const [conviction, setConviction] = useState(
    initial.conviction != null ? String(initial.conviction) : "5"
  );
  const [entryPrice, setEntryPrice] = useState(
    initial.entry_price != null ? String(initial.entry_price) : ""
  );
  const [stopPrice, setStopPrice] = useState(
    initial.stop_price != null ? String(initial.stop_price) : ""
  );
  const [targetPrice, setTargetPrice] = useState(
    initial.target_price != null ? String(initial.target_price) : ""
  );
  const [entryNote, setEntryNote] = useState(initial.entry_note ?? "");
  const [catalysts, setCatalysts] = useState<JournalCatalyst[]>(initial.catalysts ?? []);
  const [riskFactors, setRiskFactors] = useState(initial.risk_factors ?? "");
  const [researchFollowups, setResearchFollowups] = useState(initial.research_followups ?? "");
  const [tagsInput, setTagsInput] = useState((initial.personal_tags ?? []).join(", "));
  const [outcome, setOutcome] = useState<JournalOutcome>(initial.outcome ?? "watching");
  const [positionIntent, setPositionIntent] = useState<PositionIntent>(
    initial.position_intent ?? "researching"
  );
  const [bullPrice, setBullPrice] = useState(
    initial.bull_case_price != null ? String(initial.bull_case_price) : ""
  );
  const [basePrice, setBasePrice] = useState(
    initial.base_case_price != null ? String(initial.base_case_price) : ""
  );
  const [bearPrice, setBearPrice] = useState(
    initial.bear_case_price != null ? String(initial.bear_case_price) : ""
  );
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [usage, setUsage] = useState<JournalResearchUsageStatus | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [researchNudge, setResearchNudge] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);
  const thesisRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

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

  useEffect(() => {
    setRiskFactors(initial.risk_factors ?? "");
    setResearchFollowups(initial.research_followups ?? "");
  }, [initial.risk_factors, initial.research_followups, initial.journal_updated_at]);

  function toggleCatalyst(c: JournalCatalyst) {
    setCatalysts((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function draftWithAi() {
    setDrafting(true);
    setError("");
    setDraftApplied(false);
    try {
      const res = await fetch(
        `/api/watchlist/${encodeURIComponent(symbol)}/journal/draft-thesis`,
        { method: "POST" }
      );
      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        setError("Draft request failed — try again in a moment.");
        return;
      }
      if (!res.ok) {
        const code = typeof data.error === "string" ? data.error : "";
        if (code === "quota_exceeded") {
          setError("Monthly AI limit reached — try again next month.");
        } else if (code === "ai_not_configured") {
          setError("AI is not configured in this environment.");
        } else if (code === "ai_unavailable") {
          setError("AI could not generate a draft — try again.");
        } else if (code === "not_on_watchlist") {
          setError("Symbol not on your watchlist.");
        } else {
          setError("Could not draft thesis — try again.");
        }
        return;
      }
      const draftThesis = typeof data.thesis === "string" ? data.thesis.trim() : "";
      if (!draftThesis) {
        setError("AI returned an empty draft — try again.");
        return;
      }
      setThesis(draftThesis);
      if (Array.isArray(data.catalysts)) {
        setCatalysts(data.catalysts as typeof catalysts);
      }
      if (typeof data.risk_factors === "string") setRiskFactors(data.risk_factors);
      if (data.conviction != null) setConviction(String(data.conviction));
      if (typeof data.entry_note === "string") setEntryNote(data.entry_note);
      if (Array.isArray(data.personal_tags) && data.personal_tags.length > 0) {
        setTagsInput((data.personal_tags as string[]).join(", "));
      }
      const applyPrice = (key: keyof typeof data, setter: (v: string) => void) => {
        const v = data[key];
        if (typeof v === "number" && v > 0) setter(String(v));
      };
      applyPrice("entry_price", setEntryPrice);
      applyPrice("stop_price", setStopPrice);
      applyPrice("target_price", setTargetPrice);
      applyPrice("bull_case_price", setBullPrice);
      applyPrice("base_case_price", setBasePrice);
      applyPrice("bear_case_price", setBearPrice);
      const usagePayload = data.usage as { used?: number; remaining?: number } | undefined;
      if (usagePayload?.used != null && usagePayload?.remaining != null) {
        setUsage((u) =>
          u
            ? {
                ...u,
                used: usagePayload.used!,
                remaining: usagePayload.remaining!,
              }
            : u
        );
      } else {
        void loadUsage();
      }
      setDraftApplied(true);
      requestAnimationFrame(() => {
        thesisRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        thesisRef.current?.focus();
      });
    } catch {
      setError("Could not draft thesis — check your connection and try again.");
    } finally {
      setDrafting(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    setResearchNudge(false);
    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}/journal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thesis: thesis.trim() || null,
          conviction: conviction ? Number(conviction) : null,
          entry_price: entryPrice ? Number(entryPrice) : null,
          stop_price: stopPrice ? Number(stopPrice) : null,
          target_price: targetPrice ? Number(targetPrice) : null,
          entry_note: entryNote.trim() || null,
          catalysts,
          risk_factors: riskFactors.trim() || null,
          research_followups: researchFollowups.trim() || null,
          personal_tags: parseTagsInput(tagsInput),
          outcome,
          position_intent: positionIntent,
          bull_case_price: bullPrice ? Number(bullPrice) : null,
          base_case_price: basePrice ? Number(basePrice) : null,
          bear_case_price: bearPrice ? Number(bearPrice) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Could not save plan.");
        return;
      }
      onSaved(data.journal as WatchlistJournal);
      setSaved(true);
      if (thesis.trim()) {
        setResearchNudge(true);
      }
      router.refresh();
    } catch {
      setError("Could not save plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="pf-workspace-panel space-y-6 p-5 sm:space-y-7 sm:p-6 lg:p-7">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Thesis &amp; plan
        </p>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Private research notebook — start with a thesis (AI draft or your own), then catalysts,
          plan levels, and logged updates. Saves are recorded in the edit log below.
        </p>
      </div>

      {error && !thesis.trim() ? (
        <p className="pf-journal-error-hint" role="alert">
          {error}
        </p>
      ) : null}

      {!thesis.trim() ? (
        <p className="pf-journal-step-hint">
          <span className="font-semibold">Step 1:</span> Draft why you&apos;re watching{" "}
          {symbol.toUpperCase()} — use <span className="font-semibold">Draft with AI</span> for a
          starter pack, edit it, then click <span className="font-semibold">Save journal</span>.
          Research review below stress-tests your draft; it does not replace the thesis field.
        </p>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="journal-thesis">Why am I watching this?</Label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={
              drafting || usage?.configured === false || (usage?.remaining ?? 0) <= 0
            }
            onClick={() => void draftWithAi()}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {drafting ? "Drafting…" : "Draft with AI"}
          </Button>
        </div>
        {usage ? (
          <p className="mt-1 text-[10px] text-[var(--pf-gray-500)]">
            {usage.configured
              ? `${usage.remaining}/${usage.limit} AI journal uses left this month (draft + review share quota)`
              : "AI not configured"}
          </p>
        ) : null}
        {draftApplied ? (
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            Draft applied — thesis, catalysts, risks, tags, and plan levels filled where available.
            Edit anything, then save journal.
          </p>
        ) : null}
        {error ? (
          <p className="mt-1 text-xs font-semibold text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
        <Textarea
          ref={thesisRef}
          id="journal-thesis"
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder="AI infrastructure growth, earnings turnaround, theme exposure…"
          className="mt-2 min-h-[128px] resize-y sm:min-h-[140px]"
          maxLength={4000}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <Label htmlFor="journal-conviction">Conviction (1–10)</Label>
          <Select
            id="journal-conviction"
            value={conviction}
            onChange={(e) => setConviction(e.target.value)}
            className="mt-1.5 h-10 font-semibold"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="journal-outcome">Outcome</Label>
          <Select
            id="journal-outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as JournalOutcome)}
            className="mt-1.5 h-10 font-semibold"
          >
            {JOURNAL_OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="journal-posture">Trade posture</Label>
          <Select
            id="journal-posture"
            value={positionIntent}
            onChange={(e) => setPositionIntent(e.target.value as PositionIntent)}
            className="mt-1.5 h-10 font-semibold"
          >
            {POSITION_INTENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[10px] text-[var(--pf-gray-500)]">
            {POSITION_INTENT_OPTIONS.find((o) => o.value === positionIntent)?.hint}
          </p>
        </div>
      </div>

      <div>
        <Label>Catalysts</Label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {JOURNAL_CATALYST_OPTIONS.map((c) => {
            const on = catalysts.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCatalyst(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                  on
                    ? "border-[var(--pf-red)] bg-[var(--pf-red)]/10 text-[var(--pf-red)]"
                    : "pf-pill-inactive border hover:border-[var(--pf-gray-300)]"
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="journal-risks">What could invalidate this?</Label>
        <Textarea
          id="journal-risks"
          value={riskFactors}
          onChange={(e) => setRiskFactors(e.target.value)}
          placeholder="Revenue slowdown, valuation, customer concentration, regulatory risk…"
          className="mt-2 min-h-[96px] resize-y sm:min-h-[108px]"
          maxLength={2000}
        />
      </div>

      <div>
        <Label htmlFor="journal-followups">Open research items</Label>
        <Textarea
          id="journal-followups"
          value={researchFollowups}
          onChange={(e) => setResearchFollowups(e.target.value)}
          placeholder={"• Check SOL/BTC ratio vs prior cycle\n• Verify DEX volume trend on Solscan…"}
          className="mt-2 min-h-[88px] resize-y font-mono text-xs sm:min-h-[96px] sm:text-sm"
          maxLength={2000}
        />
        <p className="mt-1 text-[10px] text-[var(--pf-gray-500)]">
          Homework from AI research review — bullet list of gaps to verify. Your thesis stays clean;
          use <span className="font-semibold">Apply feedback to plan</span> after a review to merge
          new items here.
        </p>
      </div>

      <div>
        <Label htmlFor="journal-tags">Personal tags</Label>
        <Input
          id="journal-tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="AI, swing trade, earnings play, long-term hold"
          className="mt-1.5"
        />
        <p className="mt-1 text-[10px] text-[var(--pf-gray-500)]">Comma-separated — for your own filters later.</p>
      </div>

      <div>
        <Label htmlFor="journal-entry-note">Ideal entry zone (text)</Label>
        <Input
          id="journal-entry-note"
          value={entryNote}
          onChange={(e) => setEntryNote(e.target.value)}
          placeholder="Under $40, retest of 200 MA…"
          className="mt-1.5"
          maxLength={500}
        />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Trade plan ($)
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="journal-entry">Entry</Label>
            <Input
              id="journal-entry"
              type="number"
              step="any"
              min="0"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="journal-stop">Stop</Label>
            <Input
              id="journal-stop"
              type="number"
              step="any"
              min="0"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="journal-target">Target</Label>
            <Input
              id="journal-target"
              type="number"
              step="any"
              min="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Bull / base / bear ($)
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="journal-bull">Bull case</Label>
            <Input
              id="journal-bull"
              type="number"
              step="any"
              min="0"
              value={bullPrice}
              onChange={(e) => setBullPrice(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="journal-base">Base case</Label>
            <Input
              id="journal-base"
              type="number"
              step="any"
              min="0"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="journal-bear">Bear case</Label>
            <Input
              id="journal-bear"
              type="number"
              step="any"
              min="0"
              value={bearPrice}
              onChange={(e) => setBearPrice(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
        </div>
      </div>

      {saved ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-emerald-700">
            Saved — changes recorded in the plan edit log below.
          </p>
          {researchNudge ? (
            <p className="text-xs text-[var(--pf-gray-600)]">
              Next: run{" "}
              <a href="#journal-research" className="font-semibold text-indigo-700 hover:underline">
                AI research review
              </a>{" "}
              to stress-test your thesis and capture open items without rewriting your draft.
            </p>
          ) : null}
        </div>
      ) : null}
      {error && thesis.trim() ? (
        <p className="text-xs font-semibold text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? COPY.journalSavingPlan : COPY.journalSavePlan}
      </Button>
    </form>
  );
}
