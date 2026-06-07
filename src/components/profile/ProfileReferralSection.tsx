"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProfileAffiliateVouchers } from "@/components/profile/ProfileAffiliateVouchers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReferralHistoryRow, ReferralStats } from "@/lib/referrals/service";

function formatUsdCents(cents: number): string {
  const d = cents / 100;
  return d % 1 === 0 ? `$${d.toFixed(0)}` : `$${d.toFixed(2)}`;
}

function statusLabel(status: string): string {
  if (status === "converted") return "Activated";
  if (status === "signed_up") return "Signed up";
  if (status === "sent") return "Invite sent";
  if (status === "applied") return "Credit applied";
  if (status === "skipped_cap") return "Monthly cap reached";
  if (status === "skipped_no_customer") return "Pending billing link";
  return status.replace(/_/g, " ");
}

export function ProfileReferralSection() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistoryRow[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/referrals");
    if (!res.ok) {
      setError("Could not load referral program.");
      return;
    }
    setStats((await res.json()) as ReferralStats);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/referrals/history");
    if (res.ok) {
      setHistory((await res.json()).history as ReferralHistoryRow[]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (showHistory && history === null) void loadHistory();
  }, [showHistory, history, loadHistory]);

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

  async function sendInvites() {
    if (!emailInput.trim()) return;
    setInviteLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/referrals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailInput }),
      });
      const json = (await res.json()) as {
        sent?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(json.error === "no_valid_emails" ? "Enter valid email addresses." : "Invite failed.");
        return;
      }
      setEmailInput("");
      setMessage(
        `Sent ${json.sent ?? 0} invite(s)` +
          (json.skipped ? ` · ${json.skipped} skipped` : "") +
          (json.errors?.includes("email_not_configured")
            ? " — email not configured on server (use copy link)."
            : "")
      );
      void loadHistory();
    } catch {
      setError("Invite failed.");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <section className="pf-workspace-panel p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
          <Gift className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Referrals
          </p>
          <h2 className="mt-1 text-lg font-bold text-[var(--pf-black)]">
            Refer friends, earn billing credits
          </h2>
        </div>
      </div>

      {stats?.programEnabled ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
          Earn {stats.referrerReward} when a friend activates membership ({stats.monthlyCap}). They
          get <strong className="font-semibold text-[var(--pf-gray-800)]">{stats.refereeOffer}</strong> on
          their first month when they join with your link.
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--pf-gray-600)]">
          Referral rewards are paused. You can still share your link.
        </p>
      )}

      {error ? <p className="mt-3 text-sm text-[var(--pf-red)]">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

      {stats ? (
        <>
          <MetricsStrip
            variant="embedded"
            className="mt-4 border-t border-[var(--pf-border)] pt-4 !px-0"
            eyebrow="Your referrals"
            items={[
              {
                label: "Credits",
                value: formatUsdCents(stats.creditBalanceCents),
                hint: "Balance",
              },
              {
                label: "This month",
                value: `${stats.rewardsThisMonth}/${stats.rewardsCap}`,
                hint: "Rewards",
              },
              { label: "Signups", value: String(stats.signedUp) },
              {
                label: "Activated",
                value: String(stats.converted),
                hint: "Paid members",
              },
            ]}
          />

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

          <div className="mt-6 rounded-lg border border-[var(--pf-border)] p-4">
            <Label htmlFor="referral-emails" className="text-sm font-semibold text-[var(--pf-black)]">
              Invite by email
            </Label>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              Add emails separated by commas (max 10 per send).
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="referral-emails"
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="friend@example.com, teammate@firm.com"
                className="min-w-0 flex-1 rounded-lg border border-[var(--pf-border)] px-3 py-2 text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={inviteLoading || !emailInput.trim()}
                onClick={() => void sendInvites()}
                className="shrink-0"
              >
                {inviteLoading ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="mt-4 text-sm font-semibold text-[var(--pf-red)] hover:underline"
          >
            {showHistory ? "Hide referral history" : "View referral history"}
          </button>

          {showHistory ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--pf-border)]">
              {history === null ? (
                <p className="p-4 text-sm text-[var(--pf-gray-500)]">Loading…</p>
              ) : history.length === 0 ? (
                <p className="p-4 text-sm text-[var(--pf-gray-500)]">
                  No referrals or invites yet.
                </p>
              ) : (
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--pf-border)] text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                      <th className="px-4 py-2">Who</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Reward</th>
                      <th className="px-4 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--pf-border)]">
                    {history.map((row) => (
                      <tr key={`${row.kind}-${row.id}`}>
                        <td className="px-4 py-2 font-medium text-[var(--pf-black)]">
                          {row.label}
                          <span className="ml-2 text-[10px] font-semibold uppercase text-[var(--pf-gray-400)]">
                            {row.kind === "invite" ? "Email" : "Member"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[var(--pf-gray-600)]">
                          {statusLabel(row.status)}
                        </td>
                        <td className="px-4 py-2 text-[var(--pf-gray-600)]">
                          {row.rewardCents != null
                            ? `${formatUsdCents(row.rewardCents)} · ${statusLabel(row.rewardStatus ?? "")}`
                            : "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-[var(--pf-gray-500)]">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}
        </>
      ) : !error ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">Loading…</p>
      ) : null}

      <div className={cn("mt-6 border-t border-[var(--pf-border)] pt-6")}>
        <ProfileAffiliateVouchers />
      </div>
    </section>
  );
}
