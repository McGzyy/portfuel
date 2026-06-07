"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WatchlistAlertPrefs } from "@/lib/alerts/preferences";

type AlertPrefsResponse = {
  watchlist: WatchlistAlertPrefs;
  smsPhoneE164: string | null;
  smsAlertsEnabled: boolean;
  emailInstantEnabled: boolean;
  notifyEmail: string | null;
  isPro: boolean;
  smsConfigured: boolean;
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
    <section className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Watchlist alerts
      </p>
      <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
        Price moves, earnings reminders, journal plan levels, and new community calls on symbols
        you follow. Members get in-app and email; Pro can add SMS text alerts.
      </p>

      <div className="mt-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 text-sm text-[var(--pf-gray-600)]">
        <span className="font-medium text-[var(--pf-black)]">Delivery: </span>
        In-app (always on)
        {data.emailInstantEnabled && data.notifyEmail ? (
          <span> · Email to {data.notifyEmail}</span>
        ) : (
          <span>
            {" "}
            · Email off — enable instant alerts in{" "}
            <Link href="#email" className="font-semibold text-[var(--pf-red)] hover:underline">
              Email settings
            </Link>
          </span>
        )}
        {data.isPro && data.smsAlertsEnabled && data.smsPhoneE164 ? (
          <span> · SMS to {data.smsPhoneE164}</span>
        ) : null}
      </div>

      {!data.emailConfigured ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Email delivery is not configured in this environment yet.
        </p>
      ) : null}

      <div className="mt-5 space-y-3 text-sm">
        <p className="font-medium text-[var(--pf-gray-700)]">Alert types</p>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={watchlist.price_move}
            onChange={(e) => setWatchlist({ ...watchlist, price_move: e.target.checked })}
          />
          Price move since you added a symbol
        </label>
        {watchlist.price_move ? (
          <label className="ml-6 block text-[var(--pf-gray-600)]">
            Threshold (%)
            <select
              value={watchlist.price_move_pct}
              onChange={(e) =>
                setWatchlist({ ...watchlist, price_move_pct: Number(e.target.value) })
              }
              className="ml-2 rounded border border-[var(--pf-gray-200)] bg-white px-2 py-1 text-sm"
            >
              {[3, 5, 7, 10, 15].map((n) => (
                <option key={n} value={n}>
                  ±{n}%
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {data.isPro ? (
          <p className="ml-6 text-xs text-[var(--pf-gray-500)]">
            Pro: set a custom ±% threshold per symbol on your{" "}
            <Link href="/dashboard/watchlist" className="font-semibold text-[var(--pf-red)] hover:underline">
              watchlist
            </Link>
            .
          </p>
        ) : null}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={watchlist.earnings}
            onChange={(e) => setWatchlist({ ...watchlist, earnings: e.target.checked })}
          />
          Upcoming earnings (equities on your watchlist)
        </label>
        {watchlist.earnings ? (
          <label className="ml-6 block text-[var(--pf-gray-600)]">
            Remind me
            <select
              value={watchlist.earnings_days_ahead}
              onChange={(e) =>
                setWatchlist({ ...watchlist, earnings_days_ahead: Number(e.target.value) })
              }
              className="ml-2 rounded border border-[var(--pf-gray-200)] bg-white px-2 py-1 text-sm"
            >
              {[1, 3, 5, 7].map((n) => (
                <option key={n} value={n}>
                  {n} day{n === 1 ? "" : "s"} before
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={watchlist.plan_levels}
            onChange={(e) => setWatchlist({ ...watchlist, plan_levels: e.target.checked })}
          />
          Journal plan levels (entry, stop, target crosses)
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={watchlist.community_calls}
            onChange={(e) => setWatchlist({ ...watchlist, community_calls: e.target.checked })}
          />
          New community calls on watchlist symbols
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={watchlist.ai_insights}
            onChange={(e) => setWatchlist({ ...watchlist, ai_insights: e.target.checked })}
            disabled={!data.aiConfigured}
          />
          AI journal context on alerts
          {data.aiConfigured ? (
            <span className="text-xs text-[var(--pf-gray-500)]">
              ({data.aiUsage.remaining}/{data.aiUsage.limit} left this month)
            </span>
          ) : (
            <span className="text-xs text-[var(--pf-gray-400)]">(AI not configured)</span>
          )}
        </label>
      </div>

      <div className="mt-6 border-t border-[var(--pf-border)] pt-4">
        <p className="text-sm font-medium text-[var(--pf-gray-700)]">SMS text alerts (Pro)</p>
        {!data.isPro ? (
          <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
            Upgrade to Pro Intelligence for text message watchlist alerts.{" "}
            <Link href="#billing" className="font-semibold text-[var(--pf-red)] hover:underline">
              Billing
            </Link>
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              US/international mobile in E.164 format (e.g. +15551234567). Watchlist alerts only —
              not DMs or social notifications.
            </p>
            {!data.smsConfigured ? (
              <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                SMS is not configured on this environment yet (Twilio env vars missing).
              </p>
            ) : null}
            <label className="mt-3 block text-sm font-medium text-[var(--pf-gray-700)]">
              Mobile number
              <input
                type="tel"
                autoComplete="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="+15551234567"
                className="mt-1 w-full max-w-md rounded-lg border border-[var(--pf-gray-200)] bg-white px-3 py-2 text-sm font-mono"
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                disabled={!data.smsConfigured || !smsPhone.trim()}
              />
              Send watchlist alerts via SMS
            </label>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[var(--pf-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save alert settings"}
        </button>
        {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
        {error ? <span className="text-sm text-[var(--pf-red)]">{error}</span> : null}
      </div>
    </section>
  );
}
