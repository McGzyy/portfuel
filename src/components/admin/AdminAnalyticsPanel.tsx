"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { AdminCohortChart } from "@/components/admin/AdminCohortChart";
import { AdminDailyChart } from "@/components/admin/AdminDailyChart";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import {
  adminAnalyticsDelta,
  type AdminAnalytics,
  type AdminAnalyticsPeriod,
} from "@/lib/admin/analytics";
import { cn, formatPct } from "@/lib/utils";

function fmtUsd(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
}

function mrrKpiTitle(source: AdminAnalytics["revenue"]["mrrSource"]): string {
  if (source === "stripe") return "MRR (Stripe)";
  if (source === "estimated") return "MRR (est.)";
  return "MRR";
}

function mrrKpiSub(revenue: AdminAnalytics["revenue"]): string {
  const arr = `${fmtUsd(revenue.arrUsd)} ARR`;
  if (revenue.mrrSource === "stripe" && revenue.stripeSubscriptionCount != null) {
    const subs = revenue.stripeSubscriptionCount;
    const paid = `${revenue.paidStripe} paying · ${revenue.paidMonthly} mo · ${revenue.paidAnnual} yr`;
    return `${arr} · ${subs} Stripe sub${subs === 1 ? "" : "s"} · ${paid}`;
  }
  if (revenue.paidStripe > 0) {
    return `${arr} · ${revenue.paidStripe} paying · ${revenue.paidMonthly} mo · ${revenue.paidAnnual} yr`;
  }
  if (revenue.compExempt > 0 || revenue.proTrial > 0) {
    const parts: string[] = [];
    if (revenue.compExempt > 0) parts.push(`${revenue.compExempt} comp`);
    if (revenue.proTrial > 0) parts.push(`${revenue.proTrial} trial`);
    return `${arr} · ${parts.join(" · ")}`;
  }
  return arr;
}

function fmtRate(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

function fmtDelta(n: number | null): string {
  if (n == null) return "";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Math.round(n)}% vs prior`;
}

function KpiCard({
  title,
  value,
  sub,
  delta,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  delta?: number | null;
  accent?: "positive" | "negative" | "neutral";
}) {
  const deltaTone =
    delta == null ? undefined : delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";

  return (
    <div className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {title}
      </p>
      <p
        className={cn(
          "mt-2 text-3xl font-bold tracking-tight tabular-nums",
          accent === "positive" && "text-emerald-600",
          accent === "negative" && "text-rose-600",
          accent == null && "text-[var(--pf-black)]"
        )}
      >
        {value}
      </p>
      {delta != null ? (
        <p
          className={cn(
            "mt-1.5 text-xs font-semibold tabular-nums",
            deltaTone === "positive" && "text-emerald-600",
            deltaTone === "negative" && "text-rose-600",
            deltaTone === "neutral" && "text-[var(--pf-gray-500)]"
          )}
        >
          {fmtDelta(delta)}
        </p>
      ) : null}
      {sub ? <p className="mt-1 text-xs text-[var(--pf-gray-500)]">{sub}</p> : null}
    </div>
  );
}

function StatRow({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "positive" | "negative";
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--pf-gray-700)]">{label}</p>
        {hint ? <p className="text-[11px] text-[var(--pf-gray-500)]">{hint}</p> : null}
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-bold tabular-nums",
          accent === "positive" && "text-emerald-600",
          accent === "negative" && "text-rose-600",
          !accent && "text-[var(--pf-black)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  max,
  rank,
}: {
  label: string;
  value: number;
  max: number;
  rank: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-mono font-bold text-[var(--pf-black)]">
          {rank > 0 ? `${rank}. ` : ""}
          {label}
        </span>
        <span className="tabular-nums text-[var(--pf-gray-600)]">
          {value} call{value === 1 ? "" : "s"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--pf-gray-100)]">
        <div
          className="h-full rounded-full bg-[var(--pf-red)]/85 transition-all"
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

const PERIODS: { days: AdminAnalyticsPeriod; label: string }[] = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
];

export function AdminAnalyticsPanel() {
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>(30);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (days: AdminAnalyticsPeriod, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();
      if (!res.ok) {
        setError("Could not load analytics.");
        return;
      }
      setData(json as AdminAnalytics);
    } catch {
      setError("Could not load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  function exportCsv() {
    if (!data) return;
    const lines = [
      "date,signups,calls",
      ...data.timeseries.signups.map((s, i) => {
        const calls = data.timeseries.calls[i]?.count ?? 0;
        return `${s.date},${s.count},${calls}`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfuel-analytics-${data.meta.periodDays}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-rose-600">{error || "No data."}</p>;
  }

  const avg = data.calls.avgReturnPct;
  const avgAccent =
    avg == null ? undefined : avg >= 0 ? ("positive" as const) : ("negative" as const);
  const signupsDelta = adminAnalyticsDelta(data.members.signupsPeriod, data.members.signupsPrior);
  const callsDelta = adminAnalyticsDelta(data.calls.period, data.calls.prior);
  const topSymbolMax = data.topSymbols[0]?.count ?? 1;
  const churnReasonMax = data.churn.reasons[0]?.count ?? 1;
  const updatedAt = new Date(data.meta.generatedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        group="Insights"
        title="Platform analytics"
        description="Growth, billing, product activity, and churn signals from live Supabase + Stripe. MRR is summed from active Stripe subscriptions when configured; otherwise estimated from paying members only."
        actions={
          <>
            <div className="inline-flex rounded-lg border border-[var(--pf-border)] p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setPeriod(p.days)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    period === p.days
                      ? "bg-[var(--pf-black)] text-white"
                      : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-50)]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void load(period, true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)] disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </>
        }
        footer={
          <p className="text-[11px] text-[var(--pf-gray-400)]">Last updated {updatedAt}</p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title={`Signups (${data.meta.periodDays}d)`}
          value={String(data.members.signupsPeriod)}
          delta={signupsDelta}
          sub={`${data.members.active} active · ${data.members.pending} pending`}
        />
        <KpiCard
          title={mrrKpiTitle(data.revenue.mrrSource)}
          value={fmtUsd(data.revenue.mrrUsd)}
          sub={mrrKpiSub(data.revenue)}
        />
        <KpiCard
          title={`Activation (${data.meta.periodDays}d)`}
          value={fmtRate(data.members.activationRatePeriod)}
          sub={`${data.members.churnedPeriod} churned · ${data.members.churnedPrior} prior period`}
          accent={
            data.members.activationRatePeriod != null && data.members.activationRatePeriod >= 0.6
              ? "positive"
              : "neutral"
          }
        />
        <KpiCard
          title={`Calls (${data.meta.periodDays}d)`}
          value={String(data.calls.period)}
          delta={callsDelta}
          sub={
            data.calls.callsPerActiveMemberPeriod == null
              ? "— per active member"
              : `${data.calls.callsPerActiveMemberPeriod.toFixed(2)} per active member`
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminDailyChart
          title="Member signups"
          subtitle={`New accounts · last ${data.meta.periodDays} days`}
          series={data.timeseries.signups}
        />
        <AdminDailyChart
          title="Calls published"
          subtitle={`Member + desk · last ${data.meta.periodDays} days`}
          series={data.timeseries.calls}
          accentClass="bg-[var(--pf-black)]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="pf-workspace-panel p-5 lg:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Billing
              </p>
              <h3 className="mt-1 text-sm font-bold text-[var(--pf-black)]">
                Paying vs exempt access
              </h3>
            </div>
            <Link
              href="/admin?tab=members"
              className="shrink-0 text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Members
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[var(--pf-border)]">
            <StatRow
              label="Paying via Stripe"
              value={String(data.revenue.paidStripe)}
              hint={
                data.revenue.paidStripe > 0
                  ? `Member ${data.revenue.paidStripeMember} · Pro ${data.revenue.paidStripePro} · ${data.revenue.paidMonthly} mo · ${data.revenue.paidAnnual} yr`
                  : "No Stripe customer on active accounts"
              }
            />
            <StatRow
              label="Comp / exempt"
              value={String(data.revenue.compExempt)}
              hint={
                data.revenue.compExempt > 0
                  ? `Member ${data.revenue.compMember} · Pro ${data.revenue.compPro}${
                      data.revenue.compOpenEnded > 0
                        ? ` · ${data.revenue.compOpenEnded} open-ended`
                        : ""
                    }`
                  : "Founding / admin comp — no Stripe sub"
              }
            />
            <StatRow
              label="Pro trial grant"
              value={String(data.revenue.proTrial)}
              hint="Active pro_granted_until, no Stripe"
            />
            <StatRow
              label="Effective access"
              value={`${data.revenue.effectiveMember + data.revenue.effectivePro}`}
              hint={`Member ${data.revenue.effectiveMember} · Pro ${data.revenue.effectivePro} (includes grants)`}
            />
            <StatRow label="Trusted members" value={String(data.members.trusted)} />
            <StatRow label="Cancelled (all time)" value={String(data.members.cancelled)} />
          </div>
          {data.revenue.memberTierPct != null ? (
            <div className="mt-4">
              <p className="mb-2 text-[11px] text-[var(--pf-gray-500)]">
                Effective tier split (member vs pro)
              </p>
              <div className="flex h-2 overflow-hidden rounded-full">
                <div
                  className="bg-[var(--pf-gray-400)]"
                  style={{ width: `${data.revenue.memberTierPct * 100}%` }}
                />
                <div
                  className="bg-[var(--pf-red)]"
                  style={{ width: `${(data.revenue.proTierPct ?? 0) * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="pf-workspace-panel p-5 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Product health
          </p>
          <h3 className="mt-1 text-sm font-bold text-[var(--pf-black)]">Calls & engagement</h3>
          <div className="mt-4 divide-y divide-[var(--pf-border)]">
            <StatRow label="Calls all time" value={String(data.calls.total)} />
            <StatRow label="Fueled desk calls" value={String(data.calls.fueled)} />
            <StatRow
              label="Avg return"
              value={formatPct(avg)}
              accent={avgAccent}
            />
            <StatRow label="Comments" value={String(data.engagement.totalComments)} />
            <StatRow label="Votes" value={String(data.engagement.totalVotes)} />
            <StatRow
              label="Comments / call"
              value={
                data.engagement.commentsPerCall == null
                  ? "—"
                  : data.engagement.commentsPerCall.toFixed(2)
              }
            />
          </div>
        </section>

        <section className="pf-workspace-panel p-5 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Growth loops
          </p>
          <h3 className="mt-1 text-sm font-bold text-[var(--pf-black)]">Referrals</h3>
          <div className="mt-4 divide-y divide-[var(--pf-border)]">
            <StatRow label="Signed up via referral" value={String(data.referrals.signedUp)} />
            <StatRow label="Converted to paid" value={String(data.referrals.converted)} />
            <StatRow label="Invites pending" value={String(data.referrals.invitesSent)} />
            <StatRow
              label="Conversion rate"
              value={fmtRate(data.referrals.conversionRate)}
              accent={
                data.referrals.conversionRate != null && data.referrals.conversionRate >= 0.25
                  ? "positive"
                  : undefined
              }
            />
          </div>
        </section>
      </div>

      <section className="pf-workspace-panel p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Retention
        </p>
        <h3 className="mt-1 text-sm font-bold text-[var(--pf-black)]">Weekly signup cohorts</h3>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Last 8 weeks — red is signups, green overlay is members still active today.
        </p>
        <div className="mt-5">
          <AdminCohortChart cohorts={data.cohorts} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="pf-workspace-panel p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Market activity
          </p>
          <h3 className="mt-1 text-sm font-bold text-[var(--pf-black)]">Most called symbols</h3>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">Frequency across all calls.</p>
          {data.topSymbols.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--pf-gray-500)]">No calls yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {data.topSymbols.map((row, i) => (
                <HorizontalBar
                  key={row.symbol}
                  rank={i + 1}
                  label={row.symbol}
                  value={row.count}
                  max={topSymbolMax}
                />
              ))}
            </div>
          )}
        </section>

        <section className="pf-workspace-panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Churn signals
              </p>
              <h3 className="mt-1 text-sm font-bold text-[var(--pf-black)]">
                Cancellation reasons
              </h3>
              <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                {data.churn.feedbackCount} response
                {data.churn.feedbackCount === 1 ? "" : "s"} in last {data.meta.periodDays}d.
              </p>
            </div>
            <Link
              href="/admin?tab=churn"
              className="shrink-0 text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              View all
            </Link>
          </div>
          {data.churn.reasons.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--pf-gray-500)]">No feedback in this period.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {data.churn.reasons.map((row) => (
                <HorizontalBar
                  key={row.reason}
                  rank={0}
                  label={row.label}
                  value={row.count}
                  max={churnReasonMax}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
