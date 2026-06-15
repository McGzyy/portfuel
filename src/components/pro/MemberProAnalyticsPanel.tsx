import { MetricsStrip, type MetricItem } from "@/components/dashboard/MetricsStrip";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import {
  hasMemberProAnalytics,
  type MemberProAnalytics,
} from "@/lib/users/member-analytics";

export function buildMemberProAnalyticsItems(analytics: MemberProAnalytics): MetricItem[] {
  const items = [];

  if (analytics.targetTrackedCount > 0) {
    items.push({
      label: "Target hit rate",
      value: analytics.targetHitRatePct != null ? `${analytics.targetHitRatePct}%` : "—",
      hint: `${analytics.targetHitCount} of ${analytics.targetTrackedCount} reached target`,
    });
  }

  if (analytics.currentWinStreak > 0 || analytics.bestWinStreak > 0) {
    items.push({
      label: "Win streak",
      value: String(analytics.currentWinStreak),
      hint:
        analytics.bestWinStreak > analytics.currentWinStreak
          ? `Best ${analytics.bestWinStreak} · by publish date`
          : "Current · by publish date",
      accent:
        analytics.currentWinStreak > 0 ? ("positive" as const) : undefined,
    });
  }

  if (analytics.calls30d > 0) {
    items.push({
      label: "30d win rate",
      value: analytics.winRate30dPct != null ? `${analytics.winRate30dPct}%` : "—",
      hint: `${analytics.wins30d} of ${analytics.calls30d} calls`,
      accent:
        analytics.winRate30dPct != null && analytics.winRate30dPct >= 50
          ? ("positive" as const)
          : analytics.winRate30dPct != null && analytics.winRate30dPct < 50
            ? ("negative" as const)
            : undefined,
    });
  }

  if (analytics.avgOpenTargetProgress != null) {
    items.push({
      label: "Open avg progress",
      value: `${analytics.avgOpenTargetProgress}%`,
      hint: "Mean target progress on open calls",
    });
  }

  if (analytics.avgHoldDaysClosed != null && analytics.closedCount > 0) {
    items.push({
      label: "Avg hold (closed)",
      value: `${analytics.avgHoldDaysClosed}d`,
      hint: `${analytics.closedCount} closed call${analytics.closedCount === 1 ? "" : "s"}`,
    });
  }

  return items;
}

export function MemberProAnalyticsPanel({
  analytics,
  locked,
  proGateCta,
}: {
  analytics: MemberProAnalytics;
  locked: boolean;
  proGateCta: ProGateCta;
}) {
  if (!hasMemberProAnalytics(analytics)) return null;

  const items = buildMemberProAnalyticsItems(analytics);

  const body = (
    <MetricsStrip
      eyebrow="Pro · book analytics"
      items={items}
    />
  );

  if (!locked) return body;

  return (
    <ProIntelligenceGate
      locked
      cta={proGateCta}
      title="Book analytics"
      description="Target hit rate, win streaks, 30-day win rate, and hold time on your published calls."
      compact
      teaser={
        <p className="text-sm text-[var(--pf-gray-600)]">
          {analytics.targetHitRatePct != null
            ? `${analytics.targetHitRatePct}% target hit rate · ${analytics.currentWinStreak} call win streak`
            : `${analytics.currentWinStreak} call win streak · deeper stats on Pro`}
        </p>
      }
    >
      {body}
    </ProIntelligenceGate>
  );
}
