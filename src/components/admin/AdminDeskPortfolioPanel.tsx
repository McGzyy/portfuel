"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DeskPortfolioEntry } from "@/lib/desk/portfolio";

type AdminPortfolioPayload = {
  entries: DeskPortfolioEntry[];
  allowedCrypto: { symbol: string; finnhub_symbol: string; display_name: string | null }[];
};

const emptyForm = {
  assetClass: "equity" as "equity" | "crypto",
  symbol: "",
  direction: "long" as "long" | "short",
  conviction: 3,
  horizonTag: "",
  thesis: "",
  entryPrice: "",
  targetPrice: "",
  stopPrice: "",
  status: "open" as "open" | "closed",
};

export function AdminDeskPortfolioPanel() {
  const [data, setData] = useState<AdminPortfolioPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/desk-portfolio");
      const json = await res.json();
      if (!res.ok) {
        setError("Could not load model portfolio.");
        return;
      }
      setData(json as AdminPortfolioPayload);
    } catch {
      setError("Could not load model portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function startEdit(entry: DeskPortfolioEntry) {
    setEditingId(entry.id);
    setForm({
      assetClass: entry.asset_class,
      symbol: entry.symbol,
      direction: entry.direction,
      conviction: entry.conviction,
      horizonTag: entry.horizon_tag ?? "",
      thesis: entry.thesis,
      entryPrice: entry.entry_price != null ? String(entry.entry_price) : "",
      targetPrice: entry.target_price != null ? String(entry.target_price) : "",
      stopPrice: entry.stop_price != null ? String(entry.stop_price) : "",
      status: entry.status,
    });
    setMessage("");
    setError("");
  }

  function parseOptionalPrice(raw: string): number | null {
    const t = raw.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  async function save() {
    if (form.thesis.trim().length < 10) {
      setError("Thesis must be at least 10 characters.");
      return;
    }
    if (!form.symbol.trim()) {
      setError("Symbol is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/desk-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId ?? undefined,
          assetClass: form.assetClass,
          symbol: form.symbol.trim(),
          direction: form.direction,
          conviction: form.conviction,
          horizonTag: form.horizonTag.trim() || null,
          thesis: form.thesis.trim(),
          entryPrice: parseOptionalPrice(form.entryPrice),
          targetPrice: parseOptionalPrice(form.targetPrice),
          stopPrice: parseOptionalPrice(form.stopPrice),
          status: form.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json.error === "demo_readonly"
            ? "Demo mode is read-only."
            : json.error === "crypto_not_allowed"
              ? "Symbol is not on the crypto allowlist."
              : "Save failed.";
        setError(msg);
        return;
      }
      setData({ entries: json.entries, allowedCrypto: json.allowedCrypto });
      setMessage(editingId ? "Position updated." : "Position added to model portfolio.");
      resetForm();
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this portfolio entry?")) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/desk-portfolio?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "demo_readonly" ? "Demo mode is read-only." : "Delete failed.");
        return;
      }
      setData({ entries: json.entries, allowedCrypto: json.allowedCrypto });
      if (editingId === id) resetForm();
      setMessage("Entry removed.");
    } catch {
      setError("Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  const cryptoOptions = data?.allowedCrypto ?? [];

  return (
    <div className="space-y-6">
      <div className="pf-workspace-panel p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Fueled model portfolio
        </p>
        <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
          Active desk theses with entry, target, stop, and live marks — shown on Fueled desk and
          overview sidebar.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Asset class
            <select
              value={form.assetClass}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  assetClass: e.target.value as "equity" | "crypto",
                  symbol: e.target.value === "crypto" ? "" : f.symbol,
                }))
              }
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="equity">Equity</option>
              <option value="crypto">Crypto (allowlist)</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Symbol
            {form.assetClass === "crypto" ? (
              <select
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm font-mono"
              >
                <option value="">Select…</option>
                {cryptoOptions.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol}
                    {c.display_name ? ` · ${c.display_name}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                maxLength={12}
                placeholder="NVDA"
                className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm font-mono"
              />
            )}
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Direction
            <select
              value={form.direction}
              onChange={(e) =>
                setForm((f) => ({ ...f, direction: e.target.value as "long" | "short" }))
              }
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Conviction (1–5)
            <input
              type="number"
              min={1}
              max={5}
              value={form.conviction}
              onChange={(e) =>
                setForm((f) => ({ ...f, conviction: Number(e.target.value) || 3 }))
              }
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Horizon tag
            <input
              value={form.horizonTag}
              onChange={(e) => setForm((f) => ({ ...f, horizonTag: e.target.value }))}
              maxLength={32}
              placeholder="2–6w"
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Status
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as "open" | "closed" }))
              }
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Entry price
            <input
              value={form.entryPrice}
              onChange={(e) => setForm((f) => ({ ...f, entryPrice: e.target.value }))}
              inputMode="decimal"
              placeholder="Optional"
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)]">
            Target price
            <input
              value={form.targetPrice}
              onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))}
              inputMode="decimal"
              placeholder="Optional"
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-[var(--pf-gray-700)] sm:col-span-2">
            Stop price
            <input
              value={form.stopPrice}
              onChange={(e) => setForm((f) => ({ ...f, stopPrice: e.target.value }))}
              inputMode="decimal"
              placeholder="Optional"
              className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-[var(--pf-gray-700)]">
          Thesis
          <textarea
            value={form.thesis}
            onChange={(e) => setForm((f) => ({ ...f, thesis: e.target.value }))}
            rows={4}
            maxLength={2000}
            placeholder="Why the desk is in this name…"
            className="mt-2 w-full rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update position" : "Add position"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Cancel edit
            </Button>
          ) : null}
          {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
          {error ? <span className="text-sm text-rose-600">{error}</span> : null}
        </div>
      </div>

      <div className="pf-workspace-panel overflow-hidden">
        <p className="border-b border-[var(--pf-border)] px-5 py-3 text-sm font-semibold text-[var(--pf-black)]">
          Current positions ({data?.entries.length ?? 0})
        </p>
        {(data?.entries.length ?? 0) === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--pf-gray-500)]">
            No portfolio entries yet. Add 2–3 open theses for launch.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--pf-border)]">
            {data?.entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold text-[var(--pf-black)]">
                    {e.symbol}{" "}
                    <span className="font-sans text-xs font-normal text-[var(--pf-gray-500)]">
                      · {e.asset_class} · {e.direction} · {e.status}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--pf-gray-600)]">{e.thesis}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => startEdit(e)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-rose-700"
                    onClick={() => void remove(e.id)}
                    disabled={saving}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
