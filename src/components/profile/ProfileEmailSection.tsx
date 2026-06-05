"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Prefs = {
  notifyEmail: string | null;
  emailInstantEnabled: boolean;
  emailDigestEnabled: boolean;
  marketingMemberOptIn: boolean;
  marketingProOptIn: boolean;
  emailConfigured: boolean;
};

type VerifyStatus = {
  email: string | null;
  emailVerified: boolean;
};

export function ProfileEmailSection() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [verify, setVerify] = useState<VerifyStatus | null>(null);
  const [email, setEmail] = useState("");
  const [instant, setInstant] = useState(true);
  const [digest, setDigest] = useState(true);
  const [marketingMember, setMarketingMember] = useState(false);
  const [marketingPro, setMarketingPro] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [prefsRes, verifyRes] = await Promise.all([
      fetch("/api/auth/email-preferences"),
      fetch("/api/auth/verify-email"),
    ]);
    if (prefsRes.ok) {
      const data = (await prefsRes.json()) as Prefs;
      setPrefs(data);
      setEmail(data.notifyEmail ?? "");
      setInstant(data.emailInstantEnabled);
      setDigest(data.emailDigestEnabled);
      setMarketingMember(data.marketingMemberOptIn);
      setMarketingPro(data.marketingProOptIn);
    }
    if (verifyRes.ok) {
      setVerify((await verifyRes.json()) as VerifyStatus);
    }
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
        marketingMemberOptIn: marketingMember,
        marketingProOptIn: marketingPro,
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
        Email & notifications
      </p>

      {verify ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 text-sm">
          <div>
            <span className="text-[var(--pf-gray-500)]">Account email: </span>
            <span className="font-medium">{verify.email ?? "Not set"}</span>
            {verify.emailVerified ? (
              <span className="ml-2 text-emerald-600">Verified</span>
            ) : (
              <span className="ml-2 text-amber-600">Not verified</span>
            )}
          </div>
          {!verify.emailVerified ? (
            <Link
              href="/verify-email"
              className="font-semibold text-[var(--pf-red)] hover:underline"
            >
              Verify email →
            </Link>
          ) : (
            <Link
              href="/verify-email"
              className="text-[var(--pf-gray-600)] hover:text-[var(--pf-red)] hover:underline"
            >
              Change email
            </Link>
          )}
        </div>
      ) : null}

      <p className="mt-3 text-sm text-[var(--pf-gray-500)]">
        Alert address can match your account email or a separate inbox. Weekly digest covers
        Fueled portfolio marks, your calls, and community movers. Instant email covers comments,
        desk updates, DMs, and watchlist alerts (configure types in{" "}
        <Link href="#alerts" className="font-semibold text-[var(--pf-red)] hover:underline">
          Alerts
        </Link>
        ).
      </p>

      {!prefs.emailConfigured ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Email delivery is not configured on this environment yet (Resend API key missing).
        </p>
      ) : null}

      <label className="mt-4 block text-sm font-medium text-[var(--pf-gray-700)]">
        Alert email address
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

      <div className="mt-6 border-t border-[var(--pf-border)] pt-4">
        <p className="text-sm font-medium text-[var(--pf-gray-700)]">Product updates (optional)</p>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Separate lists — you can opt into member news, Pro desk updates, or both.
        </p>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={marketingMember}
              onChange={(e) => setMarketingMember(e.target.checked)}
            />
            Member community & platform updates
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={marketingPro}
              onChange={(e) => setMarketingPro(e.target.checked)}
            />
            Pro intelligence & desk announcements
          </label>
        </div>
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
