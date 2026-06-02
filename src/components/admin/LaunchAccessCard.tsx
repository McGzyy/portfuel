"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type FoundingPayload = {
  urls: {
    inviteSignup: string;
    paidJoin: string;
    profilePromoHint: string;
  };
  voucherCode: string;
  voucherReady: boolean;
};

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function LaunchAccessCard() {
  const [data, setData] = useState<FoundingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [ensuring, setEnsuring] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/launch/founding");
      const json = await res.json();
      if (!res.ok) {
        setError("Could not load founding access links.");
        return;
      }
      setData(json);
    } catch {
      setError("Could not load founding access links.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function ensureVoucher() {
    setEnsuring(true);
    setError("");
    try {
      const res = await fetch("/api/admin/launch/founding", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError("Could not create founding voucher.");
        return;
      }
      await load();
      if (json.created) {
        setCopied("voucher");
        setTimeout(() => setCopied(null), 2000);
      }
    } catch {
      setError("Could not create founding voucher.");
    } finally {
      setEnsuring(false);
    }
  }

  async function handleCopy(key: string, text: string) {
    try {
      await copyText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Copy failed — select the link manually.");
    }
  }

  if (loading) {
    return (
      <section className="pf-workspace-panel p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-[var(--pf-gray-100)]" />
      </section>
    );
  }

  return (
    <section className="pf-workspace-panel overflow-hidden">
      <div className="border-b border-[var(--pf-border)] bg-gradient-to-b from-[var(--pf-gray-50)] to-white px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Member access
        </p>
        <h3 className="mt-0.5 text-sm font-bold text-[var(--pf-black)]">
          Founding friends — no Stripe required
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
          Send the invite link for new accounts. After signup, open their row in Members → Member 360
          → <strong>Comp Pro</strong>. They still complete 2FA before the workspace.
        </p>
      </div>

      <div className="space-y-4 p-5">
        {error ? (
          <p className="text-sm text-[var(--pf-red)]">{error}</p>
        ) : null}

        {data ? (
          <>
            <CopyRow
              label="Invite signup (skip Stripe)"
              value={data.urls.inviteSignup}
              copied={copied === "invite"}
              onCopy={() => handleCopy("invite", data.urls.inviteSignup)}
            />
            <CopyRow
              label="Standard paid join"
              value={data.urls.paidJoin}
              copied={copied === "join"}
              onCopy={() => handleCopy("join", data.urls.paidJoin)}
            />

            <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-4">
              <p className="text-xs font-semibold text-[var(--pf-gray-700)]">
                Already active? Pro trial voucher
              </p>
              <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                Code <span className="font-mono font-semibold">{data.voucherCode}</span> — 30-day
                Pro intelligence (redeem on Profile → Promotions). Does not replace Comp Pro for new
                signups.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={ensuring || data.voucherReady}
                  onClick={() => void ensureVoucher()}
                >
                  {data.voucherReady
                    ? "Voucher ready"
                    : ensuring
                      ? "Creating…"
                      : "Create founding voucher"}
                </Button>
                <Link href="/admin?tab=vouchers">
                  <Button type="button" size="sm" variant="ghost">
                    All vouchers
                  </Button>
                </Link>
              </div>
            </div>

            <ol className="list-decimal space-y-1.5 pl-4 text-xs text-[var(--pf-gray-600)]">
              <li>Send invite link → friend creates account</li>
              <li>Admin → Members → open their row → Comp Pro</li>
              <li>Friend verifies email (when Resend is live) and sets up 2FA</li>
            </ol>
          </>
        ) : null}
      </div>
    </section>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--pf-gray-700)]">{label}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-[var(--pf-gray-500)]">{value}</p>
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={onCopy}>
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
