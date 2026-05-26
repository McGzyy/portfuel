"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DeskDraftKind } from "@/lib/ai/desk-draft";

export function AdminDeskDraftHelper({
  kind,
  symbol,
  direction,
  onApply,
}: {
  kind: DeskDraftKind;
  symbol?: string;
  direction?: "long" | "short";
  onApply: (text: string) => void;
}) {
  const [bullets, setBullets] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function draft() {
    if (bullets.trim().length < 8) {
      setError("Add a few bullet points first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/desk-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          bullets: bullets.trim(),
          symbol: symbol?.trim() || undefined,
          direction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "demo_readonly" ? "Demo is read-only." : "Draft failed.");
        return;
      }
      onApply(data.text as string);
      setBullets("");
    } catch {
      setError("Draft failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-[var(--pf-border)] bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        AI draft helper
      </p>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        Paste rough bullets — AI expands into desk copy. You edit before saving.
      </p>
      <textarea
        value={bullets}
        onChange={(e) => setBullets(e.target.value)}
        rows={3}
        placeholder={
          kind === "weekly_note"
            ? "e.g. Focus on mega-cap AI · watching NVDA levels · crypto beta selective"
            : "e.g. Leader in X · earnings in 2w · stop under prior low"
        }
        className="mt-3 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => void draft()}>
          {loading ? "Drafting…" : "Draft with AI"}
        </Button>
        {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      </div>
    </div>
  );
}
