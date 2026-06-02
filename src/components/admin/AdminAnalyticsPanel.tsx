"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDailyChart } from "@/components/admin/AdminDailyChart";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import type { AdminAnalytics } from "@/lib/admin/analytics";
import { cn, formatPct } from "@/lib/utils";

export function AdminAnalyticsPanel() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/analytics");
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

  if (error || !data) {
    return <p className="mt-8 text-sm text-rose-600">{error || "No data."}</p>;
  }

  const avg = data.calls.avgReturnPct;
  const avgAccent =
    avg == null ? undefined : avg >= 0 ? ("positive" as const) : ("negative" as const);

  function fmtUsd(n: number): string {
    return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
  }

  function fmtRate(n: number | null): string {
    if (n == null) return "—";
    return `${Math.round(n * 100)}%`;
  }

  function KpiCard({
    title,
    value,
    sub,
    accent,
  }: {
    title: string;
    value: string;
    sub?: string;
    accent?: "positive" | "negative" | "neutral";
  }) {
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
        {sub ? <p className="mt-2 text-xs text-[var(--pf-gray-500)]">{sub}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard
          title="Active members"
          value={String(data.members.active)}
          sub={`${data.members.total} total · ${data.members.pending} pending`}
        />
        <KpiCard
          title="MRR (est.)"
          value={fmtUsd(data.revenue.mrrUsd)}
          sub={`${fmtUsd(data.revenue.arrUsd)} ARR`}
        />
        <KpiCard
          title="Activation (30d)"
          value={fmtRate(data.members.activationRate30d)}
          sub={`${data.members.signups30d} signups · ${data.members.churned30d} churned`}
          accent={data.members.activationRate30d != null && data.members.activationRate30d >= 0.6 ? "positive" : "neutral"}
        />
        <KpiCard
          title="Calls per active (7d)"
          value={
            data.calls.callsPerActiveMember7d == null
              ? "—"
              : data.calls.callsPerActiveMember7d.toFixed(2)
          }
          sub={`${data.calls.last7d} calls last 7d`}
        />
      </div>

      <MetricsStrip
        eyebrow="Platform · members"
        items={[
          { label: "Total", value: String(data.members.total) },
          { label: "Active", value: String(data.members.active) },
          { label: "Pending", value: String(data.members.pending) },
          { label: "Cancelled", value: String(data.members.cancelled) },
          { label: "Signups (7d)", value: String(data.members.signups7d) },
        ]}
      />
      <MetricsStrip
        eyebrow="Billing · tiers"
        items={[
          { label: "Member $79", value: String(data.members.memberTier) },
          { label: "Pro $129", value: String(data.members.proTier) },
          { label: "Trusted", value: String(data.members.trusted) },
        ]}
      />
      <MetricsStrip
        eyebrow="Platform · calls"
        items={[
          { label: "All time", value: String(data.calls.total) },
          { label: "Last 7 days", value: String(data.calls.last7d) },
          { label: "Fueled desk", value: String(data.calls.fueled) },
          {
            label: "Avg return",
            value: formatPct(avg),
            accent: avgAccent,
          },
        ]}
      />
      <MetricsStrip
        eyebrow="Platform · engagement"
        items={[
          { label: "Comments", value: String(data.engagement.totalComments) },
          { label: "Votes cast", value: String(data.engagement.totalVotes) },
          {
            label: "Comments/call",
            value:
              data.engagement.commentsPerCall == null
                ? "—"
                : data.engagement.commentsPerCall.toFixed(2),
          },
          {
            label: "Votes/call",
            value:
              data.engagement.votesPerCall == null ? "—" : data.engagement.votesPerCall.toFixed(2),
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminDailyChart
          title="Signups · 30 days"
          subtitle="New member accounts (excludes admin)"
          series={data.timeseries.signups}
        />
        <AdminDailyChart
          title="Calls published · 30 days"
          subtitle="All member + desk calls"
          series={data.timeseries.calls}
        />
      </div>

      <div className="pf-workspace-panel p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Most called symbols
        </p>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Frequency across all calls.
        </p>
        {data.topSymbols.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--pf-gray-500)]">No calls yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--pf-border)]">
            {data.topSymbols.map((row, i) => (
              <li
                key={row.symbol}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-mono font-bold text-[var(--pf-black)]">
                  {i + 1}. {row.symbol}
                </span>
                <span className="tabular-nums text-[var(--pf-gray-600)]">
                  {row.count} call{row.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
