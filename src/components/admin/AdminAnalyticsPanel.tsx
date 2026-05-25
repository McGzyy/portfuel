"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDailyChart } from "@/components/admin/AdminDailyChart";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import type { AdminAnalytics } from "@/lib/admin/analytics";
import { formatPct } from "@/lib/utils";

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

  return (
    <div className="mt-8 space-y-4">
      <MetricsStrip
        eyebrow="Platform · members"
        items={[
          { label: "Total", value: String(data.members.total) },
          { label: "Active", value: String(data.members.active) },
          { label: "Pending", value: String(data.members.pending) },
          { label: "Cancelled", value: String(data.members.cancelled) },
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
