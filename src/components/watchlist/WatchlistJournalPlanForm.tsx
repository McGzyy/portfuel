"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  JOURNAL_CATALYST_OPTIONS,
  JOURNAL_OUTCOMES,
  parseTagsInput,
  type JournalCatalyst,
  type JournalOutcome,
} from "@/lib/watchlist/journal-meta";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";
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
  const [tagsInput, setTagsInput] = useState((initial.personal_tags ?? []).join(", "));
  const [outcome, setOutcome] = useState<JournalOutcome>(initial.outcome ?? "watching");
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
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleCatalyst(c: JournalCatalyst) {
    setCatalysts((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
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
          personal_tags: parseTagsInput(tagsInput),
          outcome,
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
    } catch {
      setError("Could not save plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="pf-workspace-panel space-y-5 p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Thesis &amp; plan
        </p>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Private research notebook — catalysts, risks, and scenario prices draw on your chart.
          Saves are recorded in the edit log below.
        </p>
      </div>

      <div>
        <Label htmlFor="journal-thesis">Why am I watching this?</Label>
        <Textarea
          id="journal-thesis"
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder="AI infrastructure growth, earnings turnaround, theme exposure…"
          className="mt-1.5 min-h-[88px]"
          maxLength={4000}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="journal-conviction">Conviction (1–10)</Label>
          <select
            id="journal-conviction"
            value={conviction}
            onChange={(e) => setConviction(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white px-3 py-2 text-sm font-semibold"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="journal-outcome">Outcome</Label>
          <select
            id="journal-outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as JournalOutcome)}
            className="mt-1.5 w-full rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white px-3 py-2 text-sm font-semibold"
          >
            {JOURNAL_OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label>Catalysts</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {JOURNAL_CATALYST_OPTIONS.map((c) => {
            const on = catalysts.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCatalyst(c)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors",
                  on
                    ? "border-[var(--pf-red)] bg-[var(--pf-red)]/10 text-[var(--pf-red)]"
                    : "border-[var(--pf-border)] bg-white text-[var(--pf-gray-600)] hover:border-[var(--pf-gray-300)]"
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
          className="mt-1.5 min-h-[72px]"
          maxLength={2000}
        />
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
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
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
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
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

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {saved ? (
        <p className="text-xs font-semibold text-emerald-700">
          Saved — changes recorded in the plan edit log below.
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? COPY.journalSavingPlan : COPY.journalSavePlan}
      </Button>
    </form>
  );
}
