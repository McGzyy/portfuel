"use client";

import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";

type Settings = {
  allowSocialHighlight: boolean;
  showThesis: boolean;
  showUsername: boolean;
  rulesSummary: string;
};

export function ProfileSocialHighlightSection() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/social-highlight");
    if (!res.ok) {
      setError("Could not load spotlight preferences.");
      return;
    }
    setSettings((await res.json()) as Settings);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: Partial<Settings>) {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/auth/social-highlight", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowSocialHighlight: patch.allowSocialHighlight ?? settings.allowSocialHighlight,
        showThesis: patch.showThesis ?? settings.showThesis,
        showUsername: patch.showUsername ?? settings.showUsername,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save preferences.");
      return;
    }
    setSettings((await res.json()) as Settings);
    setMessage("Preferences saved.");
  }

  if (!settings) return null;

  return (
    <section className="pf-workspace-panel p-4 sm:p-6">
      <p className="pf-eyebrow">Brand spotlight</p>
      <h2 className="mt-2 text-lg font-bold tracking-tight text-[var(--pf-black)]">
        Public recognition on X
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        PortFuel may feature verified member calls that meet performance and time-on-record standards
        on our official X account. Posts include a branded chart, attribution, and an optional
        thesis excerpt. We do not share new entries, early calls, or unproven ideas.
      </p>
      <p className="mt-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-xs leading-relaxed text-[var(--pf-gray-600)]">
        {settings.rulesSummary}
      </p>

      {error ? <p className="mt-3 text-sm text-[var(--pf-red)]">{error}</p> : null}
      {message ? (
        <p className="mt-3 text-sm font-medium text-emerald-800">{message}</p>
      ) : null}

      <div className="mt-5 space-y-4 border-t border-[var(--pf-border)] pt-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 accent-[var(--pf-red)]"
            checked={settings.allowSocialHighlight}
            onChange={(e) => void save({ allowSocialHighlight: e.target.checked })}
            disabled={saving}
          />
          <span className="text-sm leading-relaxed text-[var(--pf-gray-700)]">
            I authorize PortFuel to publish qualifying calls from my track record on the official
            PortFuel X account, subject to the standards above.
          </span>
        </label>

        {settings.allowSocialHighlight ? (
          <div className="ml-1 space-y-3 border-l-2 border-[var(--pf-border)] pl-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="accent-[var(--pf-red)]"
                checked={settings.showThesis}
                onChange={(e) => void save({ showThesis: e.target.checked })}
                disabled={saving}
              />
              <Label className="font-normal text-sm text-[var(--pf-gray-700)]">
                Include a short thesis excerpt in the post
              </Label>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="accent-[var(--pf-red)]"
                checked={settings.showUsername}
                onChange={(e) => void save({ showUsername: e.target.checked })}
                disabled={saving}
              />
              <Label className="font-normal text-sm text-[var(--pf-gray-700)]">
                Attribute with @username (otherwise display name only)
              </Label>
            </label>
          </div>
        ) : null}
      </div>
    </section>
  );
}
