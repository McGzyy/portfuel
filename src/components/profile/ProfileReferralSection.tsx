"use client";

import { useCallback, useEffect, useState } from "react";

type ReferralStats = {
  referralCode: string;
  shareUrl: string;
  signedUp: number;
  converted: number;
};

export function ProfileReferralSection() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/referrals");
    if (!res.ok) {
      setError("Could not load referral link.");
      return;
    }
    setStats((await res.json()) as ReferralStats);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyLink() {
    if (!stats?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(stats.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed — select the link and copy manually.");
    }
  }

  return (
    <section className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Invite members
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
        Share your link. When someone joins PortFuel and activates their membership, it counts toward
        your referrals.
      </p>

      {error ? <p className="mt-3 text-sm text-[var(--pf-red)]">{error}</p> : null}

      {stats ? (
        <>
          <div className="mt-4 flex flex-wrap gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Signups
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--pf-black)]">
                {stats.signedUp}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Activated
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--pf-black)]">
                {stats.converted}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Your code
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-[var(--pf-black)]">
                {stats.referralCode}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={stats.shareUrl}
              className="min-w-0 flex-1 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-sm text-[var(--pf-gray-700)]"
              aria-label="Referral link"
            />
            <button
              type="button"
              onClick={() => void copyLink()}
              className="shrink-0 rounded-lg bg-[var(--pf-black)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pf-gray-800)]"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </>
      ) : !error ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">Loading referral link…</p>
      ) : null}
    </section>
  );
}
