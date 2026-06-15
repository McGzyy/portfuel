import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { parseAppTimestamp } from "@/lib/time/timestamp";
import { isCallWin, type CallCreditInput } from "@/lib/scoring/call-credit";

export type MemberAnalyticsCall = {
  return_pct: number | null;
  peak_return_pct?: number | null;
  closed_at?: string | null;
  target_progress?: number | null;
  called_at: string;
  call_state?: string | null;
};

export type MemberProAnalytics = {
  targetHitRatePct: number | null;
  targetHitCount: number;
  targetTrackedCount: number;
  currentWinStreak: number;
  bestWinStreak: number;
  winRate30dPct: number | null;
  wins30d: number;
  calls30d: number;
  avgOpenTargetProgress: number | null;
  avgHoldDaysClosed: number | null;
  closedCount: number;
};

function toCreditInput(c: MemberAnalyticsCall): CallCreditInput {
  return {
    return_pct: c.return_pct,
    peak_return_pct: c.peak_return_pct ?? null,
    closed_at: c.closed_at ?? null,
    target_progress: c.target_progress ?? null,
  };
}

function isScoredCall(c: MemberAnalyticsCall): boolean {
  if (c.call_state === "pending_entry" || c.call_state === "cancelled" || c.call_state === "expired") {
    return false;
  }
  return true;
}

function computeWinStreaks(calls: MemberAnalyticsCall[]): {
  current: number;
  best: number;
} {
  const sorted = [...calls].sort(
    (a, b) => parseAppTimestamp(b.called_at).getTime() - parseAppTimestamp(a.called_at).getTime()
  );

  let best = 0;
  let run = 0;
  for (const c of sorted) {
    if (isCallWin(toCreditInput(c))) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (const c of sorted) {
    if (isCallWin(toCreditInput(c))) current += 1;
    else break;
  }

  return { current, best };
}

/** Pro depth metrics — target hits, streaks, recent win rate, open progress, hold time. */
export function computeMemberProAnalytics(
  calls: MemberAnalyticsCall[]
): MemberProAnalytics {
  const scored = calls.filter(isScoredCall);

  const withProgress = scored.filter((c) => c.target_progress != null);
  const targetHitCount = withProgress.filter((c) => Number(c.target_progress) >= 100).length;
  const targetHitRatePct =
    withProgress.length > 0
      ? Math.round((targetHitCount / withProgress.length) * 100)
      : null;

  const { current: currentWinStreak, best: bestWinStreak } = computeWinStreaks(scored);

  const cutoff = Date.now() - 30 * 86_400_000;
  const recent = scored.filter(
    (c) => parseAppTimestamp(c.called_at).getTime() >= cutoff
  );
  const wins30d = recent.filter((c) => isCallWin(toCreditInput(c))).length;
  const winRate30dPct =
    recent.length > 0 ? Math.round((wins30d / recent.length) * 100) : null;

  const openWithProgress = scored.filter(
    (c) => isOpenMemberCall(c) && c.target_progress != null
  );
  const avgOpenTargetProgress =
    openWithProgress.length > 0
      ? Math.round(
          openWithProgress.reduce((sum, c) => sum + Number(c.target_progress), 0) /
            openWithProgress.length
        )
      : null;

  const closed = scored.filter((c) => c.closed_at);
  let avgHoldDaysClosed: number | null = null;
  if (closed.length > 0) {
    const totalDays = closed.reduce((sum, c) => {
      const start = parseAppTimestamp(c.called_at).getTime();
      const end = parseAppTimestamp(c.closed_at!).getTime();
      return sum + Math.max(0, (end - start) / 86_400_000);
    }, 0);
    avgHoldDaysClosed = Math.round((totalDays / closed.length) * 10) / 10;
  }

  return {
    targetHitRatePct,
    targetHitCount,
    targetTrackedCount: withProgress.length,
    currentWinStreak,
    bestWinStreak,
    winRate30dPct,
    wins30d,
    calls30d: recent.length,
    avgOpenTargetProgress,
    avgHoldDaysClosed,
    closedCount: closed.length,
  };
}

export function hasMemberProAnalytics(analytics: MemberProAnalytics): boolean {
  return (
    analytics.targetTrackedCount > 0 ||
    analytics.calls30d > 0 ||
    analytics.currentWinStreak > 0 ||
    analytics.avgOpenTargetProgress != null ||
    analytics.closedCount > 0
  );
}
