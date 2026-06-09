"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteAnnouncement } from "@/lib/announcements/types";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function audienceLabel(a: SiteAnnouncement["audience"]) {
  if (a === "pro") return "Pro only";
  if (a === "member") return "Member (non-Pro)";
  return "All members";
}

export function AdminAnnouncementsPanel() {
  const [items, setItems] = useState<SiteAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<SiteAnnouncement["severity"]>("info");
  const [audience, setAudience] = useState<SiteAnnouncement["audience"]>("all");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/announcements");
      if (!res.ok) throw new Error("fetch_failed");
      const json = (await res.json()) as { announcements: SiteAnnouncement[] };
      setItems(json.announcements);
    } catch {
      setError("Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        severity,
        audience,
      };
      if (linkUrl.trim()) payload.linkUrl = linkUrl.trim();
      if (linkLabel.trim()) payload.linkLabel = linkLabel.trim();
      if (endsAt) payload.endsAt = new Date(endsAt).toISOString();

      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("create_failed");
      setTitle("");
      setBody("");
      setLinkUrl("");
      setLinkLabel("");
      setEndsAt("");
      await load();
    } catch {
      setError("Could not publish announcement.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: SiteAnnouncement) {
    const res = await fetch(`/api/admin/announcements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.is_active }),
    });
    if (res.ok) void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) void load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        group="Content & desk"
        title="Member announcements"
        description="Publish a banner at the top of the member workspace — maintenance windows, new Pro features, desk notes, or launch updates. Members can dismiss each message once."
      />

      <form onSubmit={publish} className="pf-workspace-panel space-y-4 p-6">
        <h3 className="text-sm font-bold text-[var(--pf-black)]">New announcement</h3>
        {error ? (
          <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ann-title">Headline</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Scheduled maintenance tonight"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ann-body">Message</Label>
            <textarea
              id="ann-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={2000}
              required
              placeholder="Quotes may be delayed 9–10pm ET while we upgrade market data."
              className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-severity">Tone</Label>
            <select
              id="ann-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SiteAnnouncement["severity"])}
              className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-audience">Audience</Label>
            <select
              id="ann-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value as SiteAnnouncement["audience"])}
              className="w-full rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm"
            >
              <option value="all">All members</option>
              <option value="member">Member tier only</option>
              <option value="pro">Pro only</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-link">Link URL (optional)</Label>
            <Input
              id="ann-link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://portfuel.pro/dashboard/desk"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-link-label">Link label</Label>
            <Input
              id="ann-link-label"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="View desk"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ann-ends">Auto-hide after (optional)</Label>
            <Input
              id="ann-ends"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Publishing…" : "Publish to workspace"}
        </Button>
      </form>

      <section className="pf-workspace-panel overflow-hidden">
        <div className="border-b border-[var(--pf-border)] px-5 py-4">
          <h3 className="text-sm font-bold text-[var(--pf-black)]">History</h3>
          <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
            Toggle off to hide without deleting. Active messages within their schedule show in the
            workspace.
          </p>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--pf-gray-500)]">No announcements yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--pf-border)]">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        item.severity === "warning" && "bg-amber-100 text-amber-900",
                        item.severity === "success" && "bg-emerald-100 text-emerald-900",
                        item.severity === "info" && "bg-slate-100 text-slate-700"
                      )}
                    >
                      {item.severity}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                      {audienceLabel(item.audience)}
                    </span>
                    {!item.is_active ? (
                      <span className="text-[10px] font-semibold uppercase text-[var(--pf-gray-400)]">
                        Off
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[var(--pf-black)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--pf-gray-600)]">{item.body}</p>
                  <p className="mt-2 text-xs text-[var(--pf-gray-400)]">
                    Starts {formatWhen(item.starts_at)}
                    {item.ends_at ? ` · Ends ${formatWhen(item.ends_at)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => toggleActive(item)}>
                    {item.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-[var(--pf-red)]"
                    onClick={() => remove(item.id)}
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
