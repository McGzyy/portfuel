import Link from "next/link";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { formatPct } from "@/lib/utils";
import type { AssetClass } from "@/lib/market/validate-symbol";
import type { CallWithUser } from "@/lib/db/supabase";

export type TickerThesisCall = CallWithUser & { live?: boolean; from_discovery?: boolean };

function summarizeTickerCalls(calls: TickerThesisCall[]) {
  const longs = calls.filter((c) => c.direction === "long").length;
  const shorts = calls.filter((c) => c.direction === "short").length;
  const fueled = calls.filter((c) => c.is_fueled).length;
  const withReturn = calls.filter((c) => c.return_pct != null);
  const avgReturn =
    withReturn.length > 0
      ? withReturn.reduce((sum, c) => sum + Number(c.return_pct), 0) / withReturn.length
      : null;
  return { longs, shorts, fueled, avgReturn };
}

export function TickerCallsSection({
  symbol,
  assetClass,
  calls,
  session,
  viewerUserId,
  isPro,
  proLocked,
  isAdmin,
}: {
  symbol: string;
  assetClass: AssetClass;
  calls: TickerThesisCall[];
  session: boolean;
  viewerUserId?: string;
  isPro: boolean;
  proLocked: boolean;
  isAdmin: boolean;
}) {
  const summary = summarizeTickerCalls(calls);

  return (
    <section id="calls" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Community theses
          </p>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[var(--pf-black)] sm:text-2xl">
            Calls on {symbol}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--pf-gray-500)]">
            {calls.length === 0
              ? "No published theses yet — be the first on record for this symbol."
              : "On-record entry, target, and stop with live return marks."}
          </p>
        </div>
        {session && calls.length > 0 ? (
          <Link
            href={`/calls/new?asset=${assetClass}&symbol=${encodeURIComponent(symbol)}`}
            className="shrink-0"
          >
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add call
            </Button>
          </Link>
        ) : null}
      </div>

      {calls.length === 0 ? (
        <div className="pf-workspace-panel px-6 py-14 text-center">
          <p className="font-medium text-[var(--pf-gray-700)]">No calls on this ticker yet</p>
          <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
            Publish a thesis with entry, target, and stop to appear here.
          </p>
          {session ? (
            <Link
              href={`/calls/new?asset=${assetClass}&symbol=${encodeURIComponent(symbol)}`}
              className="mt-6 inline-block"
            >
              <Button>
                <Plus className="h-4 w-4" />
                Be the first to call {symbol}
              </Button>
            </Link>
          ) : (
            <Link href="/join" className="mt-6 inline-block">
              <Button variant="outline">{COPY.ctaGetAccess}</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="pf-ticker-calls-chip">
              {calls.length} thesis{calls.length === 1 ? "" : "es"}
            </span>
            {summary.longs > 0 ? (
              <span className="pf-ticker-calls-chip pf-ticker-calls-chip-long">
                <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                {summary.longs} long
              </span>
            ) : null}
            {summary.shorts > 0 ? (
              <span className="pf-ticker-calls-chip pf-ticker-calls-chip-short">
                <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
                {summary.shorts} short
              </span>
            ) : null}
            {summary.fueled > 0 ? (
              <span className="pf-ticker-calls-chip pf-ticker-calls-chip-fueled">
                {summary.fueled} Fueled
              </span>
            ) : null}
            {summary.avgReturn != null ? (
              <span className="pf-ticker-calls-chip tabular-nums">
                Avg {formatPct(summary.avgReturn)}
              </span>
            ) : null}
          </div>

          <div className="space-y-4">
            {calls.map((c) => (
              <div key={c.id} id={`thesis-${c.id}`} className="scroll-mt-24">
                <CallThesisBlock
                  call={{
                    ...c,
                    user_id: c.user_id,
                    asset_class: c.asset_class,
                    symbol: c.symbol,
                    stop_price: c.stop_price,
                    last_price: c.last_price,
                    peak_return_pct: c.peak_return_pct,
                    closed_at: c.closed_at,
                    live: c.live,
                    from_discovery: c.from_discovery,
                    users: {
                      display_name: c.users.display_name,
                      pin: c.users.username ?? c.users.pin,
                      username: c.users.username,
                      trusted_at: c.users.trusted_at,
                    },
                  }}
                  interactive={session}
                  viewerUserId={viewerUserId}
                  isPro={isPro}
                  showUpgrade={session ? proLocked : false}
                  canGenerateSummary={isPro}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
