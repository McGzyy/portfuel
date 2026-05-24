import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CallCard } from "@/components/calls/CallCard";
import { OverviewQuickActions } from "@/components/dashboard/OverviewQuickActions";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/button";
import {
  loadFeedCalls,
  loadMemberStats,
  loadYourRecentCalls,
  mapCallForCard,
  requireDashboardSession,
} from "@/lib/dashboard/data";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { formatPct, formatPrice } from "@/lib/utils";

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  if (params.tab || params.filter || params.q) {
    const qs = new URLSearchParams();
    if (params.tab) qs.set("tab", params.tab);
    if (params.filter) qs.set("filter", params.filter);
    if (params.q) qs.set("q", params.q);
    redirect(`/dashboard/feed?${qs.toString()}`);
  }

  const session = await requireDashboardSession();
  const memberStats = await loadMemberStats(session.userId);
  const latestCalls = (await loadFeedCalls("latest"))
    .filter((c) => !c.is_fueled)
    .slice(0, 3)
    .map(mapCallForCard);
  const fueledPreview = (await loadFeedCalls("latest"))
    .filter((c) => c.is_fueled)
    .slice(0, 2)
    .map(mapCallForCard);
  const yourCalls = await loadYourRecentCalls(
    session.userId,
    session.username,
    session.displayName,
    4
  );

  let watchlistPreview: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  try {
    watchlistPreview = (await fetchWatchlist(session.userId)).slice(0, 5);
  } catch {
    /* optional */
  }

  const displayLabel =
    session.displayName ??
    (session.role === "admin" ? "Administrator" : session.username);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your at-a-glance snapshot. Open Member feed, Fueled desk, or Watchlist from the menu above for full views."
        action={
          <Link href="/calls/new">
            <Button size="lg">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New call
            </Button>
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pf-stat-tile lg:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Operator
          </p>
          <p className="mt-1 text-lg font-bold">{displayLabel}</p>
          <Link
            href={`/member/${session.username}`}
            className="mt-0.5 inline-block font-mono text-sm text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
          >
            @{session.username}
          </Link>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Win rate
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {memberStats?.win_rate != null ? `${memberStats.win_rate}%` : "—"}
          </p>
        </div>
        <div className="pf-stat-tile">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Rank score
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {memberStats?.rank_score != null
              ? Number(memberStats.rank_score).toFixed(1)
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <OverviewQuickActions />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Latest member calls"
          description="Newest theses from the community"
          href={buildFeedHref({})}
          linkLabel="Open feed →"
        >
          {latestCalls.length === 0 ? (
            <p className="text-sm text-[var(--pf-gray-500)]">No calls yet.</p>
          ) : (
            <ul className="space-y-3">
              {latestCalls.map((call) => (
                <li key={call.id}>
                  <CallCard call={call} compact />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Fueled desk"
            description="Official PortFuel theses"
            href="/dashboard/desk"
            linkLabel="Open desk →"
          >
            {fueledPreview.length === 0 ? (
              <p className="text-sm text-[var(--pf-gray-500)]">No desk calls right now.</p>
            ) : (
              <ul className="space-y-3">
                {fueledPreview.map((call) => (
                  <li key={call.id}>
                    <CallCard call={call} compact />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Watchlist"
            description="Quick access to tracked symbols"
            href="/dashboard/watchlist"
            linkLabel="Manage →"
          >
            {watchlistPreview.length === 0 ? (
              <p className="text-sm text-[var(--pf-gray-500)]">No symbols tracked yet.</p>
            ) : (
              <ul className="space-y-2">
                {watchlistPreview.map((w) => (
                  <li key={w.symbol}>
                    <Link
                      href={`/ticker/${w.symbol}`}
                      className="flex items-center justify-between rounded-lg border border-[var(--pf-border)] bg-white px-3 py-2 text-sm hover:bg-[var(--pf-gray-50)]"
                    >
                      <span className="font-mono font-bold">{w.symbol}</span>
                      <span className="text-xs tabular-nums text-[var(--pf-gray-500)]">
                        {w.last_price != null
                          ? `$${formatPrice(Number(w.last_price))}`
                          : formatPct(w.return_pct)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {yourCalls.length > 0 ? (
        <div className="mt-8">
          <SectionCard
            title="Your book"
            description="Calls you published"
            href={`/member/${session.username}`}
            linkLabel="Full profile →"
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {yourCalls.map((call) => (
                <li key={call.id}>
                  <CallCard call={call} compact />
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      ) : null}

      {session.role === "admin" ? (
        <p className="mt-8 text-center text-xs text-[var(--pf-gray-500)]">
          <Link href="/admin?tab=analytics" className="font-semibold text-[var(--pf-red)] hover:underline">
            Admin analytics
          </Link>
        </p>
      ) : null}
    </>
  );
}
