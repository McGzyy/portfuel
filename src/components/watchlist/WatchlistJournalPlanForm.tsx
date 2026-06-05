"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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
    <form onSubmit={save} className="pf-workspace-panel space-y-4 p-4 sm:p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Thesis &amp; plan
        </p>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Why are you watching this? Set conviction and plan levels — they draw on your private chart.
        </p>
      </div>

      <div>
        <Label htmlFor="journal-thesis">Why am I watching this?</Label>
        <Textarea
          id="journal-thesis"
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder="AI infrastructure growth, earnings turnaround, theme exposure…"
          className="mt-1.5 min-h-[100px]"
          maxLength={4000}
        />
      </div>

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
              {n === 2 ? " · Interesting" : n === 5 ? " · Monitoring" : n === 8 ? " · Near entry" : n === 10 ? " · Highest" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="journal-entry-note">Ideal entry zone (text)</Label>
        <Input
          id="journal-entry-note"
          value={entryNote}
          onChange={(e) => setEntryNote(e.target.value)}
          placeholder="Under $40, retest of 200 MA, pullback after earnings…"
          className="mt-1.5"
          maxLength={500}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="journal-entry">Plan entry ($)</Label>
          <Input
            id="journal-entry"
            type="number"
            step="any"
            min="0"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="mt-1.5 font-mono"
          />
        </div>
        <div>
          <Label htmlFor="journal-stop">Stop ($)</Label>
          <Input
            id="journal-stop"
            type="number"
            step="any"
            min="0"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            className="mt-1.5 font-mono"
          />
        </div>
        <div>
          <Label htmlFor="journal-target">Target ($)</Label>
          <Input
            id="journal-target"
            type="number"
            step="any"
            min="0"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="mt-1.5 font-mono"
          />
        </div>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {saved ? (
        <p className="text-xs font-semibold text-emerald-700">Saved — chart levels updated.</p>
      ) : null}

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}
