"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WatchlistAlertPrefs } from "@/lib/alerts/preferences";
import { PushAlertsControl } from "@/components/pwa/PushAlertsControl";
import {
  SettingsPanelActions,
  SettingsSelectRow,
  SettingsToggleRow,
} from "@/components/settings/SettingsToggleRow";

type AlertPrefsResponse = {
  watchlist: WatchlistAlertPrefs;
  smsPhoneE164: string | null;
  smsAlertsEnabled: boolean;
  pushAlertsEnabled: boolean;
  emailInstantEnabled: boolean;
  notifyEmail: string | null;
  isPro: boolean;
  smsConfigured: boolean;
  pushConfigured: boolean;
  emailConfigured: boolean;
  aiConfigured: boolean;
  aiUsage: { used: number; limit: number; remaining: number; periodMonth: string };
};

export function ProfileAlertsSection() {
  const [data, setData] = useState<AlertPrefsResponse | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistAlertPrefs | null>(null);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/alert-preferences");
    if (!res.ok) return;
    const json = (await res.json()) as AlertPrefsResponse;
    setData(json);
    setWatchlist(json.watchlist);
    setSmsPhone(json.smsPhoneE164 ?? "");
    setSmsEnabled(json.smsAlertsEnabled);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!watchlist) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/auth/alert-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchlist,
        smsPhoneE164: smsPhone.trim(),
        smsAlertsEnabled: smsEnabled,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (body.error === "pro_required") {
        setError("SMS alerts require Pro Intelligence.");
      } else {
        setError("Could not save alert settings.");
      }
      return;
    }

    const json = (await res.json()) as AlertPrefsResponse;
    setData(json);
    setWatchlist(json.watchlist);
    setSmsPhone(json.smsPhoneE164 ?? "");
    setSmsEnabled(json.smsAlertsEnabled);
    setMessage("Alert preferences saved.");
  }

  if (!data || !watchlist) return null;

  return (
    <section className="pf-workspace-panel p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Alert types
      </p>
      <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
        What triggers notifications on symbols you follow. In-app alerts are always on.
      </p>

      <div className="mt-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 text-sm text-[var(--pf-gray-600)]">
        <span className="font-medium text-[var(--pf-black)]">Delivery: </span>
        In-app (always on)
        {data.emailInstantEnabled && data.notifyEmail ? (
          <span> · Email to {data.notifyEmail}</span>
        ) : (
          <span>
            {" "}
            · Email off — enable{" "}
            <span className="font-semibold text-[var(--pf-black)]">Instant email alerts</span> above
          </span>
        )}
        {data.isPro && data.smsAlertsEnabled && data.smsPhoneE164 ? (
          <span> · SMS to {data.smsPhoneE164}</span>
        ) : null}
        {data.pushAlertsEnabled ? <span> · Browser push</span> : null}
      </div>

      {!data.emailConfigured ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Email delivery is not configured in this environment yet.
        </p>
      ) : null}

      <div className="mt-5">
        <SettingsToggleRow
          label="Price move since add"
          description="When a watchlist symbol moves beyond your threshold since you added it."
          checked={watchlist.price_move}
          onCheckedChange={(checked) => setWatchlist({ ...watchlist, price_move: checked })}
        >
          {watchlist.price_move ? (
            <SettingsSelectRow
              label="Threshold"
              value={watchlist.price_move_pct}
              onChange={(v) =>
                setWatchlist({ ...watchlist, price_move_pct: Number(v) })
              }
              options={[3, 5, 7, 10, 15].map((n) => ({
                value: String(n),
                label: `±${n}%`,
              }))}
            />
          ) : null}
          {data.isPro && watchlist.price_move ? (
            <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
              Pro: override per symbol on your{" "}
              <Link
                href="/dashboard/watchlist"
                className="font-semibold text-[var(--pf-red)] hover:underline"
              >
                watchlist
              </Link>
              .
            </p>
          ) : null}
        </SettingsToggleRow>

        <SettingsToggleRow
          label="Upcoming earnings"
          description="Reminders for equities on your watchlist before they report."
          checked={watchlist.earnings}
          onCheckedChange={(checked) => setWatchlist({ ...watchlist, earnings: checked })}
        >
          {watchlist.earnings ? (
            <SettingsSelectRow
              label="Remind me"
              value={watchlist.earnings_days_ahead}
              onChange={(v) =>
                setWatchlist({ ...watchlist, earnings_days_ahead: Number(v) })
              }
              options={[1, 3, 5, 7].map((n) => ({
                value: String(n),
                label: `${n} day${n === 1 ? "" : "s"} before`,
              }))}
            />
          ) : null}
        </SettingsToggleRow>

        <SettingsToggleRow
          label="Journal plan levels"
          description="Entry, stop, and target crosses from your private journal."
          checked={watchlist.plan_levels}
          onCheckedChange={(checked) => setWatchlist({ ...watchlist, plan_levels: checked })}
        />

        <SettingsToggleRow
          label="Community calls"
          description="New member calls published on watchlist symbols."
          checked={watchlist.community_calls}
          onCheckedChange={(checked) =>
            setWatchlist({ ...watchlist, community_calls: checked })
          }
        />

        <SettingsToggleRow
          label="AI journal context"
          description={
            data.aiConfigured
              ? `${data.aiUsage.remaining} of ${data.aiUsage.limit} AI enrichments left this month.`
              : "AI is not configured in this environment."
          }
          checked={watchlist.ai_insights}
          onCheckedChange={(checked) => setWatchlist({ ...watchlist, ai_insights: checked })}
          disabled={!data.aiConfigured}
        />
      </div>

      <div className="mt-6 border-t border-[var(--pf-border)] pt-4">
        <p className="text-sm font-semibold text-[var(--pf-black)]">Browser push (PWA)</p>
        <PushAlertsControl
          pushConfigured={data.pushConfigured}
          pushEnabled={data.pushAlertsEnabled}
          onStatusChange={() => void load()}
        />
      </div>

      <div className="mt-6 border-t border-[var(--pf-border)] pt-2">
        <p className="pb-2 text-sm font-semibold text-[var(--pf-black)]">SMS (Pro)</p>
        {!data.isPro ? (
          <p className="text-sm text-[var(--pf-gray-500)]">
            Upgrade to Pro Intelligence for text message watchlist alerts.{" "}
            <Link
              href="/dashboard/settings?section=billing"
              className="font-semibold text-[var(--pf-red)] hover:underline"
            >
              Plan & billing
            </Link>
          </p>
        ) : (
          <>
            {!data.smsConfigured ? (
              <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                SMS is not configured on this environment yet (Twilio env vars missing).
              </p>
            ) : null}
            <label className="block text-sm font-semibold text-[var(--pf-black)]">
              Mobile number
              <input
                type="tel"
                autoComplete="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="+15551234567"
                className="mt-1.5 w-full max-w-md rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 font-mono text-sm font-normal"
              />
            </label>
            <p className="mt-1.5 text-xs text-[var(--pf-gray-500)]">
              E.164 format. Watchlist alerts only — not DMs or social notifications.
            </p>
            <div className="mt-4">
              <SettingsToggleRow
                label="SMS watchlist alerts"
                description="Text message delivery for enabled alert types above."
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
                disabled={!data.smsConfigured || !smsPhone.trim()}
              />
            </div>
          </>
        )}
      </div>

      <SettingsPanelActions
        onSave={() => void save()}
        saving={saving}
        message={message}
        error={error}
        saveLabel="Save alert settings"
      />
    </section>
  );
}
