"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DeskBriefAdmin } from "@/lib/desk/brief";
import { AdminDeskPortfolioPanel } from "@/components/admin/AdminDeskPortfolioPanel";

export function AdminDeskPanel() {
  const [data, setData] = useState<DeskBriefAdmin | null>(null);
  const [weeklyNote, setWeeklyNote] = useState("");
  const [pinnedCallId, setPinnedCallId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/desk-brief");
      const json = await res.json();
      if (!res.ok) {
        setError("Could not load desk brief.");
        return;
      }
      setData(json as DeskBriefAdmin);
      setWeeklyNote(json.weeklyNote ?? "");
      setPinnedCallId(json.pinnedCallId ?? "");
    } catch {
      setError("Could not load desk brief.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/desk-brief", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyNote: weeklyNote.trim() || null,
          pinnedCallId: pinnedCallId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "demo_readonly" ? "Demo mode is read-only." : "Save failed.");
        return;
      }
      setData(json as DeskBriefAdmin);
      setMessage("Desk brief saved. Members see it on Overview and Fueled desk.");
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  if (error && !data) {
    return <p className="mt-8 text-sm text-rose-600">{error}</p>;
  }

  return (
    <div className="mt-8 max-w-2xl space-y-6">
      <div className="pf-workspace-panel p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Fueled desk brief
        </p>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          Weekly note and optional pinned call shown on the desk page and overview hero.
        </p>

        <label className="mt-5 block text-sm font-medium text-[var(--pf-gray-700)]">
          Weekly desk note
          <textarea
            value={weeklyNote}
            onChange={(e) => setWeeklyNote(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="What the desk is focused on this week…"
            className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-[var(--pf-gray-700)]">
          Pinned desk call
          <select
            value={pinnedCallId}
            onChange={(e) => setPinnedCallId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {(data?.fueledCalls ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} · {c.direction} · {new Date(c.called_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>
        {(data?.fueledCalls.length ?? 0) === 0 ? (
          <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
            Publish a Fueled call first (admin user, is_fueled flag) to pin one here.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save desk brief"}
          </Button>
          {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
          {error ? <span className="text-sm text-rose-600">{error}</span> : null}
        </div>
      </div>

      <AdminDeskPortfolioPanel />
    </div>
  );
}
