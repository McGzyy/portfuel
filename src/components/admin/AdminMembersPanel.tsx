"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  email_verified_at: string | null;
  role: string;
  subscription_status: "pending" | "active" | "cancelled";
  membership_tier: "member" | "pro" | null;
  pro_granted_until: string | null;
  totp_verified: boolean;
  calls_count: number;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function effectiveTier(m: Member): "member" | "pro" | null {
  if (m.subscription_status !== "active") return null;
  if (m.membership_tier === "pro") return "pro";
  if (m.pro_granted_until && new Date(m.pro_granted_until).getTime() > Date.now()) {
    return "pro";
  }
  return m.membership_tier;
}

export function AdminMembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="hidden px-4 py-3 md:table-cell">Email</th>
              <th className="hidden px-4 py-3 sm:table-cell">Plan</th>
              <th className="hidden px-4 py-3 lg:table-cell">Status</th>
              <th className="hidden px-4 py-3 xl:table-cell">Member since</th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pf-border)]">
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--pf-gray-500)]">
                  No members yet.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const tier = effectiveTier(m);
                return (
                  <tr key={m.id} className="hover:bg-[var(--pf-gray-50)]/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--pf-black)]">@{m.username}</p>
                      <p className="text-xs text-[var(--pf-gray-500)]">{m.display_name ?? "—"}</p>
                      <p className="mt-0.5 text-xs text-[var(--pf-gray-400)] md:hidden">
                        {m.email ?? "No email"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="max-w-[200px] truncate text-[var(--pf-gray-700)]">
                        {m.email ?? "—"}
                      </p>
                      {m.email ? (
                        <p className="text-xs text-[var(--pf-gray-400)]">
                          {m.email_verified_at ? "Verified" : "Unverified"}
                        </p>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <TierBadge tier={tier} />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <StatusBadge status={m.subscription_status} />
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums text-[var(--pf-gray-600)] xl:table-cell">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="inline-flex h-8 items-center rounded-md bg-[var(--pf-navy)] px-3 text-xs font-semibold text-white hover:bg-[var(--pf-navy)]/90"
                      >
                        Member 360
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--pf-gray-400)]">
        Open <strong>Member 360</strong> to manage billing, comp access, moderation, and quotas.
        Friend demos: send <span className="font-mono">/join?invite=1</span>, then use Comp Pro on
        their 360 page.
      </p>
    </div>
  );
}

function TierBadge({ tier }: { tier: "member" | "pro" | null }) {
  if (!tier) {
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
