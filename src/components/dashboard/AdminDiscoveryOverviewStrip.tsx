import Link from "next/link";
import { Radar } from "lucide-react";
import { countActionableDiscoveryCandidates } from "@/lib/desk-discovery/scanner";
import {
  countOpenDiscoveryShadowCalls,
  getShadowPerformanceStats,
} from "@/lib/desk-discovery/shadow-calls";
import { formatPct, formatWinRatePct } from "@/lib/utils";

export async function AdminDiscoveryOverviewStrip() {
  const [pending, openShadows, shadowStats] = await Promise.all([
    countActionableDiscoveryCandidates().catch(() => 0),
    countOpenDiscoveryShadowCalls().catch(() => 0),
    getShadowPerformanceStats().catch(() => null),
  ]);

  if (pending === 0 && openShadows === 0 && (!shadowStats || shadowStats.totalClosed === 0)) {
    return null;
  }

  const closed = shadowStats?.totalClosed ?? 0;
  const shadowWinRate =
    shadowStats?.winRate != null ? formatWinRatePct(shadowStats.winRate * 100) : "—";
  const avgReturn =
    shadowStats?.avgReturnPct != null ? formatPct(shadowStats.avgReturnPct) : "—";

  const queueLine =
    pending > 0
      ? `${pending} candidate${pending === 1 ? "" : "s"} awaiting review`
      : "Queue clear";

  const paperLine =
    openShadows > 0
      ? `${openShadows} paper position${openShadows === 1 ? "" : "s"} open`
      : closed > 0
        ? `${closed} closed (120d) · win ${shadowWinRate} · avg ${avgReturn}`
        : "Paper track warming up";

  return (
    <section
      className="rounded-[var(--pf-radius-lg)] border border-violet-200 bg-violet-50/60 px-4 py-3 sm:px-5 sm:py-4"
      aria-label="Discovery ops"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800">
            <Radar className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--pf-black)]">Discovery pipeline</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--pf-gray-600)]">
              {queueLine} · {paperLine}
            </p>
          </div>
        </div>
        <Link
          href="/admin?tab=discovery"
          className="shrink-0 text-xs font-semibold text-violet-800 hover:text-violet-950 hover:underline"
        >
          Open Discovery →
        </Link>
      </div>
    </section>
  );
}
