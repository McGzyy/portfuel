"use client";

import { useCallback, useEffect, useState } from "react";

type AffiliateVoucher = {
  code: string;
  label: string;
  kind: string;
  shareUrl: string;
  summary: string;
  expiresAt: string | null;
  grantUses: number;
  grantMaxUses: number | null;
};

export function ProfileAffiliateVouchers() {
  const [vouchers, setVouchers] = useState<AffiliateVoucher[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/vouchers/affiliate");
    if (!res.ok) {
      setVouchers([]);
      return;
    }
    const data = await res.json();
    setVouchers(data.vouchers ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyUrl(url: string, code: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!vouchers || vouchers.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-[var(--pf-border)] pt-6">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Promo codes for referrals
      </p>
      <p className="mt-2 text-sm text-[var(--pf-gray-600)]">
        Share these links so your referrals get the offer and you get credit.
      </p>
      <ul className="mt-4 space-y-3">
        {vouchers.map((v) => (
          <li
            key={v.code}
            className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-bold text-[var(--pf-black)]">{v.code}</p>
                <p className="mt-0.5 text-sm text-[var(--pf-gray-600)]">{v.summary}</p>
                {v.expiresAt ? (
                  <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                    Expires{" "}
                    {new Date(v.expiresAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
                {v.grantMaxUses != null ? (
                  <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                    Your uses: {v.grantUses} / {v.grantMaxUses}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={v.shareUrl}
                className="min-w-0 flex-1 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2 text-xs text-[var(--pf-gray-700)]"
                aria-label={`Share link for ${v.code}`}
              />
              <button
                type="button"
                onClick={() => void copyUrl(v.shareUrl, v.code)}
                className="shrink-0 rounded-lg bg-[var(--pf-black)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pf-gray-800)]"
              >
                {copiedCode === v.code ? "Copied" : "Copy link"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
