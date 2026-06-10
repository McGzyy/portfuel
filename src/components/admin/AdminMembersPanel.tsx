"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import {
  memberBillingSource,
  memberBillingSourceLabel,
  type MemberBillingSource,
} from "@/lib/billing/billing-source";
import { cn, timeAgo } from "@/lib/utils";

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
  stripe_customer_id: string | null;
  totp_verified: boolean;
  calls_count: number;
  trusted_at: string | null;
  banned_at: string | null;
  created_at: string;
  last_active_at: string | null;
};

type StatusFilter = "all" | Member["subscription_status"];
type PlanFilter = "all" | "member" | "pro" | "none";
type BillingFilter = "all" | MemberBillingSource;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function memberInitials(m: Member) {
  const base = m.display_name?.trim() || m.username;
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function effectiveTier(m: Member): "member" | "pro" | null {
  if (m.subscription_status !== "active") return null;
  if (m.membership_tier === "pro") return "pro";
  if (m.pro_granted_until && new Date(m.pro_granted_until).getTime() > Date.now()) {
    return "pro";
  }
  return m.membership_tier;
}

function parseBillingFilter(raw: string | null): BillingFilter {
  if (raw === "stripe" || raw === "comp" || raw === "trial") return raw;
  return "all";
}

export function AdminMembersPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>(() =>
    parseBillingFilter(searchParams.get("billing"))
  );

  useEffect(() => {
    setBillingFilter(parseBillingFilter(searchParams.get("billing")));
  }, [searchParams]);

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

  const stats = useMemo(() => {
    const activeMembers = members.filter((m) => m.subscription_status === "active");
    const active = activeMembers.length;
    const pending = members.filter((m) => m.subscription_status === "pending").length;
    const pro = members.filter((m) => effectiveTier(m) === "pro").length;
    const banned = members.filter((m) => m.banned_at).length;
    const stripe = activeMembers.filter((m) => memberBillingSource(m) === "stripe").length;
    const comp = activeMembers.filter((m) => memberBillingSource(m) === "comp").length;
    const trial = activeMembers.filter((m) => memberBillingSource(m) === "trial").length;
    return { total: members.length, active, pending, pro, banned, stripe, comp, trial };
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "all" && m.subscription_status !== statusFilter) return false;
      const tier = effectiveTier(m);
      if (planFilter === "none" && tier !== null) return false;
      if (planFilter === "member" && tier !== "member") return false;
      if (planFilter === "pro" && tier !== "pro") return false;
      if (billingFilter !== "all" && memberBillingSource(m) !== billingFilter) return false;
      if (!q) return true;
      return (
        m.username.toLowerCase().includes(q) ||
        (m.display_name?.toLowerCase().includes(q) ?? false) ||
        (m.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [members, query, statusFilter, planFilter, billingFilter]);

  function openMember(userId: string) {
    router.push(`/admin/members/${userId}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-lg bg-[var(--pf-red-muted)] px-3 py-2 text-sm text-[var(--pf-red)]">
          {error}
        </p>
      ) : null}

      <AdminPanelHeader
        group="Members & support"
        title="Member directory"
        description="Search, filter, and open Member 360 for access, Pro grants, and moderation."
        footer={
          <div className="space-y-4 border-t border-[var(--pf-border)] pt-4">
            <MetricsStrip
              variant="embedded"
              className="!px-0"
              eyebrow="Roster"
              items={[
                { label: "Total", value: String(stats.total) },
                { label: "Active", value: String(stats.active), accent: "positive" },
                { label: "Pending", value: String(stats.pending) },
                { label: "Pro", value: String(stats.pro), accent: stats.pro > 0 ? "positive" : undefined },
                {
                  label: "Banned",
                  value: String(stats.banned),
                  accent: stats.banned > 0 ? "negative" : undefined,
                },
              ]}
            />
            <MetricsStrip
              variant="embedded"
              className="!px-0"
              eyebrow="Billing (active)"
              items={[
                {
                  label: "Stripe",
                  value: String(stats.stripe),
                  accent: stats.stripe > 0 ? "positive" : undefined,
                },
                { label: "Comp", value: String(stats.comp) },
                { label: "Trial", value: String(stats.trial) },
              ]}
            />
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search username, name, or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
          aria-label="Search members"
        />
        <div className="flex flex-wrap items-center gap-2">
          <BillingFilterChips value={billingFilter} onChange={setBillingFilter} />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <FilterSelect
            label="Plan"
            value={planFilter}
            onChange={(v) => setPlanFilter(v as PlanFilter)}
            options={[
              { value: "all", label: "All plans" },
              { value: "pro", label: "Pro" },
              { value: "member", label: "Member" },
              { value: "none", label: "No plan" },
            ]}
          />
          <MarketingExportButton list="member" label="Export member list" />
          <MarketingExportButton list="pro" label="Export Pro list" />
        </div>
      </div>

      {/* Directory */}
      <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[10px] font-semibold uppercase tracking-wider text-[var(--pf-gray-500)]">
                <th className="px-4 py-3.5">Member</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Security</th>
                <th className="px-4 py-3.5">Activity</th>
                <th className="px-4 py-3.5">Last active</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="w-10 px-2 py-3.5" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pf-border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-[var(--pf-gray-600)]">
                      {members.length === 0 ? "No members yet." : "No members match your filters."}
                    </p>
                    {members.length > 0 ? (
                      <button
                        type="button"
                        className="mt-2 text-sm text-[var(--pf-red)] hover:underline"
                        onClick={() => {
                          setQuery("");
                          setStatusFilter("all");
                          setPlanFilter("all");
                          setBillingFilter("all");
                        }}
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const tier = effectiveTier(m);
                  const billing = memberBillingSource(m);
                  const billingLabel = memberBillingSourceLabel(billing);
                  return (
                    <tr
                      key={m.id}
                      tabIndex={0}
                      role="link"
                      aria-label={`Open Member 360 for @${m.username}`}
                      onClick={() => openMember(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openMember(m.id);
                        }
                      }}
                      className="group cursor-pointer transition-colors hover:bg-[var(--pf-gray-50)] focus-visible:bg-[var(--pf-gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pf-red-ring)]"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                              tier === "pro"
                                ? "bg-gradient-to-br from-[var(--pf-red)] to-[var(--pf-black)]"
                                : "bg-gradient-to-br from-[var(--pf-gray-600)] to-[var(--pf-black)]"
                            )}
                          >
                            {memberInitials(m)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-[var(--pf-black)]">
                                @{m.username}
                              </span>
                              {m.trusted_at ? (
                                <span className="rounded bg-[var(--pf-gray-100)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-600)]">
                                  Trusted
                                </span>
                              ) : null}
                              {m.banned_at ? (
                                <span className="rounded bg-[var(--pf-red-muted)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-red)]">
                                  Banned
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-xs text-[var(--pf-gray-500)]">
                              {m.display_name ?? "No display name"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="max-w-[220px] truncate font-medium text-[var(--pf-gray-700)]">
                          {m.email ?? "—"}
                        </p>
                        <p className="text-xs text-[var(--pf-gray-400)]">
                          {m.email
                            ? m.email_verified_at
                              ? "Verified"
                              : "Unverified"
                            : "No email on file"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <TierBadge tier={tier} />
                        {billingLabel ? (
                          <p className="mt-0.5 text-[10px] text-[var(--pf-gray-400)]">{billingLabel}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={m.subscription_status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <SecurityCell totpVerified={m.totp_verified} emailVerified={Boolean(m.email_verified_at)} />
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-[var(--pf-gray-700)]">
                        <span className="font-medium">{m.calls_count}</span>
                        <span className="text-[var(--pf-gray-400)]"> calls</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--pf-gray-600)]">
                        {m.last_active_at ? timeAgo(m.last_active_at) : "—"}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-[var(--pf-gray-600)]">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="px-2 py-3.5 text-[var(--pf-gray-300)] group-hover:text-[var(--pf-red)]">
                        <ChevronIcon />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 ? (
          <div className="border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-2.5 text-xs text-[var(--pf-gray-500)]">
            Showing {filtered.length} of {members.length} members · Click any row for Member 360
          </div>
        ) : null}
      </div>

      <p className="text-xs text-[var(--pf-gray-400)]">
        Friend demos: send <span className="font-mono">/join?invite=1</span>, then open their row
        and use <strong>Comp Pro</strong> on Member 360.
      </p>
    </div>
  );
}

function BillingFilterChips({
  value,
  onChange,
}: {
  value: BillingFilter;
  onChange: (value: BillingFilter) => void;
}) {
  const options: { value: BillingFilter; label: string }[] = [
    { value: "all", label: "All billing" },
    { value: "stripe", label: "Stripe" },
    { value: "comp", label: "Comp" },
    { value: "trial", label: "Trial" },
  ];

  return (
    <div
      className="inline-flex rounded-lg border border-[var(--pf-border)] p-0.5"
      role="group"
      aria-label="Billing source"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
            value === option.value
              ? "bg-[var(--pf-black)] text-white"
              : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-50)]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MarketingExportButton({ list, label }: { list: "member" | "pro"; label: string }) {
  return (
    <a
      href={`/api/admin/marketing-export?list=${list}`}
      className="inline-flex h-9 items-center rounded-md border border-[var(--pf-border)] bg-white px-3 text-sm font-medium text-[var(--pf-gray-700)] shadow-[var(--pf-shadow-sm)] hover:bg-[var(--pf-gray-50)]"
    >
      {label}
    </a>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-[var(--pf-border)] bg-white px-3 text-sm text-[var(--pf-gray-700)] shadow-[var(--pf-shadow-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--pf-red-ring)]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SecurityCell({
  totpVerified,
  emailVerified,
}: {
  totpVerified: boolean;
  emailVerified: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <span className={cn(totpVerified ? "text-emerald-700" : "text-amber-700")}>
        {totpVerified ? "2FA on" : "2FA pending"}
      </span>
      <span className={cn(emailVerified ? "text-[var(--pf-gray-500)]" : "text-[var(--pf-gray-400)]")}>
        {emailVerified ? "Email verified" : "Email unverified"}
      </span>
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
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
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
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        status === "active" && "bg-emerald-50 text-emerald-700",
        status === "pending" && "bg-amber-50 text-amber-800",
        status === "cancelled" && "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]"
      )}
    >
      {status}
    </span>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="mx-auto transition-transform group-hover:translate-x-0.5"
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
