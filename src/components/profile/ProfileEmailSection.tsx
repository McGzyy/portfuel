"use client";

import { useCallback, useEffect, useState } from "react";

type Prefs = {
  notifyEmail: string | null;
  emailInstantEnabled: boolean;
  emailDigestEnabled: boolean;
  emailConfigured: boolean;
};

export function ProfileEmailSection() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [email, setEmail] = useState("");
  const [instant, setInstant] = useState(true);
  const [digest, setDigest] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/email-preferences");
    if (!res.ok) return;
    const data = (await res.json()) as Prefs;
    setPrefs(data);
    setEmail(data.notifyEmail ?? "");
    setInstant(data.emailInstantEnabled);
    setDigest(data.emailDigestEnabled);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/auth/email-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notifyEmail: email.trim(),
        emailInstantEnabled: instant,
        emailDigestEnabled: digest,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save email settings.");
      return;
    }
    const data = (await res.json()) as Prefs;
    setPrefs(data);
    setMessage("Email preferences saved.");
  }

  if (!prefs) return null;

  return (
    <section className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Email alerts
      </p>
      <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
        Get a weekly workspace digest and instant emails when someone comments on your call, posts
        on a watchlist ticker, or publishes a call from a member you follow.
      </p>

      {!prefs.emailConfigured ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Email delivery is not configured on this environment yet (Resend API key missing).
        </p>
      ) : null}

      <label className="mt-4 block text-sm font-medium text-[var(--pf-gray-700)]">
        Email address
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full max-w-md rounded-lg border border-[var(--pf-gray-200)] bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={instant}
            onChange={(e) => setInstant(e.target.checked)}
          />
          Instant alerts (watchlist calls, comments on your calls)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={digest}
            onChange={(e) => setDigest(e.target.checked)}
          />
          Weekly digest (Mondays)
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[var(--pf-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save email settings"}
        </button>
        {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
        {error ? <span className="text-sm text-[var(--pf-red)]">{error}</span> : null}
      </div>
    </section>
  );
}
