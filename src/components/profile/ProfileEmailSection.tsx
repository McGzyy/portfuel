"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  SettingsPanelActions,
  SettingsToggleRow,
} from "@/components/settings/SettingsToggleRow";

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
    <section className="pf-workspace-panel p-4 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Email delivery
      </p>
      <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
        Where alerts land and which messages you receive by email.
      </p>

      {verify ? (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="text-[var(--pf-gray-500)]">Account email: </span>
            <span className="break-all font-medium">{verify.email ?? "Not set"}</span>
            {verify.emailVerified ? (
              <span className="pf-return-up ml-2">Verified</span>
            ) : (
              <span className="ml-2 text-amber-600">Not verified</span>
            )}
          </div>
          <Link
            href="/verify-email"
            className="shrink-0 font-semibold text-[var(--pf-red)] hover:underline"
          >
            {verify.emailVerified ? "Change email" : "Verify email →"}
          </Link>
        </div>
      ) : null}

      {!prefs.emailConfigured ? (
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Email delivery is not configured on this environment yet (Resend API key missing).
        </p>
      ) : null}

      <label className="mt-5 block text-sm font-semibold text-[var(--pf-black)]">
        Alert email address
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full max-w-md rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm font-normal"
        />
      </label>
      <p className="mt-1.5 text-xs text-[var(--pf-gray-500)]">
        Can match your account email or a separate inbox for trading alerts.
      </p>

      <div className="mt-6">
        <SettingsToggleRow
          label="Instant email alerts"
          description="Comments on your calls, desk updates, DMs, and watchlist alerts (when enabled below)."
          checked={instant}
          onCheckedChange={setInstant}
          disabled={!prefs.emailConfigured}
        />
        <SettingsToggleRow
          label="Weekly digest"
          description="Monday summary — Fueled portfolio marks, your calls, and community movers."
          checked={digest}
          onCheckedChange={setDigest}
          disabled={!prefs.emailConfigured}
        />
      </div>

      <div className="mt-6 border-t border-[var(--pf-border)] pt-2">
        <p className="pb-2 text-sm font-semibold text-[var(--pf-black)]">Product updates</p>
        <SettingsToggleRow
          label="Member community & platform"
          description="Occasional news about PortFuel features and the member community."
          checked={marketingMember}
          onCheckedChange={setMarketingMember}
          disabled={!prefs.emailConfigured}
        />
        <SettingsToggleRow
          label="Pro intelligence & desk"
          description="House desk announcements and Pro research highlights."
          checked={marketingPro}
          onCheckedChange={setMarketingPro}
          disabled={!prefs.emailConfigured}
        />
      </div>

      <SettingsPanelActions
        onSave={() => void save()}
        saving={saving}
        message={message}
        error={error}
        saveLabel="Save email settings"
      />
    </section>
  );
}
