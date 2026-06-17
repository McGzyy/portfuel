"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";
import type { XAutomationPrefs } from "@/lib/social/x-automation-prefs";

type AutomationResponse = {
  env: {
    enabled: boolean;
    dryRun: boolean;
    bearerTokenSet: boolean;
    livePostingReady: boolean;
  };
  effective: XAutomationPrefs;
  managedInAdmin: boolean;
  safety: { dryRun: boolean; livePostingReady: boolean; note: string };
};

export function AdminXAutomationPanel({ onSaved }: { onSaved?: () => void }) {
  const [data, setData] = useState<AutomationResponse | null>(null);
  const [prefs, setPrefs] = useState<XAutomationPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/social/automation");
    if (!res.ok) return;
    const json = (await res.json()) as AutomationResponse;
    setData(json);
    setPrefs(json.effective);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/social/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(
        json.error === "migration_required"
          ? "Run migration 20260709100000_x_automation_prefs.sql first."
          : "Could not save automation settings."
      );
      return;
    }
    const json = (await res.json()) as { effective: XAutomationPrefs; safety: AutomationResponse["safety"] };
    setPrefs(json.effective);
    setData((prev) =>
      prev ? { ...prev, effective: json.effective, managedInAdmin: true, safety: json.safety } : prev
    );
    setMessage("X automation settings saved.");
    onSaved?.();
  }

  if (!data || !prefs) return null;

  return (
    <section className="pf-workspace-panel p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        X automation
      </p>
      <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">Posting controls</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Toggle what PortFuel posts to X automatically. Server still needs{" "}
        <code className="rounded bg-[var(--pf-gray-100)] px-1 text-xs">X_API_ENABLED</code> and a
        bearer token. Dry-run stays env-controlled for safety.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            data.env.bearerTokenSet
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          Bearer {data.env.bearerTokenSet ? "set" : "missing"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            data.env.enabled ? "bg-sky-50 text-sky-800" : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]"
          }`}
        >
          API {data.env.enabled ? "on" : "off"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            data.safety.dryRun ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          Dry run {data.safety.dryRun ? "on" : "off"}
        </span>
      </div>
      <p className="mt-2 text-xs text-[var(--pf-gray-500)]">{data.safety.note}</p>

      <div className="mt-6 space-y-1 divide-y divide-[var(--pf-border)] rounded-lg border border-[var(--pf-border)]">
        <SettingsToggleRow
          label="Autopost Fueled on publish"
          description="Chart + copy when a new Fueled desk call is published."
          checked={prefs.autopostFueledOnPublish}
          onCheckedChange={(checked) =>
            setPrefs((p) => (p ? { ...p, autopostFueledOnPublish: checked } : p))
          }
        />
        <SettingsToggleRow
          label="Autopost Fueled milestones"
          description="+10% / +25% / +50% / target with chart image."
          checked={prefs.autopostMilestones}
          onCheckedChange={(checked) =>
            setPrefs((p) => (p ? { ...p, autopostMilestones: checked } : p))
          }
        />
        <SettingsToggleRow
          label="Weekly cron · Fueled highlight"
          description="Monday batch text post for latest desk call."
          checked={prefs.cronFueledPosts}
          onCheckedChange={(checked) =>
            setPrefs((p) => (p ? { ...p, cronFueledPosts: checked } : p))
          }
        />
        <SettingsToggleRow
          label="Weekly cron · Rankings"
          description="Monday leaderboard recap post."
          checked={prefs.cronLeaderboardPosts}
          onCheckedChange={(checked) =>
            setPrefs((p) => (p ? { ...p, cronLeaderboardPosts: checked } : p))
          }
        />
        <SettingsToggleRow
          label="Weekly cron · Member wins"
          description="Spotlight qualifying member calls with chart."
          checked={prefs.cronMemberWinPosts}
          onCheckedChange={(checked) =>
            setPrefs((p) => (p ? { ...p, cronMemberWinPosts: checked } : p))
          }
        />
        <SettingsToggleRow
          label="Weekly cron · Weekly digest"
          description="Top movers composite chart post."
          checked={prefs.cronWeeklyDigestPosts}
          onCheckedChange={(checked) =>
            setPrefs((p) => (p ? { ...p, cronWeeklyDigestPosts: checked } : p))
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save automation"}
        </Button>
        {message ? <span className="text-sm text-[var(--pf-gray-600)]">{message}</span> : null}
      </div>
    </section>
  );
}
