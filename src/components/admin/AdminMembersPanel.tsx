"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
  subscription_status: "pending" | "active" | "cancelled";
  membership_tier: "member" | "pro" | null;
  totp_verified: boolean;
  calls_count: number;
  rank_score: number;
  submission_quota_week: number;
  created_at: string;
};

export function AdminMembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/members");
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load members.");
        return;
      }
      setMembers((data.members ?? []).filter((m: Member) => m.role !== "admin"));
    } catch {
      setError("Could not load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchMember(
    userId: string,
    body: {
      subscriptionStatus?: Member["subscription_status"];
      submissionQuotaWeek?: number;
      trusted?: boolean;
    }
  ) {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Update failed.");
        return;
      }
      await load();
    } catch {
      setError("Update failed.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {error ? (
        <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="hidden px-4 py-3 sm:table-cell">Status</th>
              <th className="hidden px-4 py-3 sm:table-cell">Plan</th>
              <th className="hidden px-4 py-3 md:table-cell">2FA</th>
              <th className="hidden px-4 py-3 lg:table-cell">Calls</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pf-border)]">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--pf-gray-500)]">
                  No members yet.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--pf-gray-50)]/80">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--pf-black)]">@{m.username}</p>
                    <p className="text-xs text-[var(--pf-gray-500)]">{m.display_name ?? "—"}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StatusBadge status={m.subscription_status} />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <TierBadge tier={m.membership_tier} active={m.subscription_status === "active"} />
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {m.totp_verified ? (
                      <span className="text-emerald-600">Enabled</span>
                    ) : (
                      <span className="text-amber-600">Pending</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums lg:table-cell">{m.calls_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {m.subscription_status !== "active" ? (
                        <Button
                          size="sm"
                          disabled={savingId === m.id}
                          onClick={() =>
                            patchMember(m.id, { subscriptionStatus: "active" })
                          }
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={savingId === m.id}
                          onClick={() =>
                            patchMember(m.id, { subscriptionStatus: "pending" })
                          }
                        >
                          Deactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={savingId === m.id}
                        onClick={() =>
                          patchMember(m.id, {
                            submissionQuotaWeek: m.submission_quota_week >= 5 ? 2 : 5,
                          })
                        }
                      >
                        Quota {m.submission_quota_week}/wk
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--pf-gray-400)]">
        Stripe handles paid activation; use Activate only for comped or manual access. Members need
        2FA at <span className="font-mono">/security/2fa</span> before the workspace.
      </p>
    </div>
  );
}

function TierBadge({
  tier,
  active,
}: {
  tier: Member["membership_tier"];
  active: boolean;
}) {
  if (!active || !tier) {
    return <span className="text-xs text-[var(--pf-gray-400)]">—</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        tier === "pro" && "bg-[var(--pf-red-muted)] text-[var(--pf-red)]",
        tier === "member" && "bg-[var(--pf-gray-100)] text-[var(--pf-gray-700)]"
      )}
    >
      {tier}
    </span>
  );
}

function StatusBadge({ status }: { status: Member["subscription_status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        status === "active" && "bg-emerald-50 text-emerald-700",
        status === "pending" && "bg-amber-50 text-amber-800",
        status === "cancelled" && "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]"
      )}
    >
      {status}
    </span>
  );
}
