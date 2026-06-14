import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ThesisCoachInline } from "@/components/ai/ThesisCoachInline";
import { ThesisSummaryExpand } from "@/components/ai/ThesisSummaryExpand";
import { CallResearchExpand } from "@/components/calls/CallResearchExpand";
import { CallEngagement } from "@/components/calls/CallEngagement";
import { CallPriceMetrics } from "@/components/calls/CallPriceMetrics";
import { CallDeleteButton } from "@/components/calls/CallDeleteButton";
import { CallCloseButton } from "@/components/calls/CallCloseButton";
import { CallReturnDisplay } from "@/components/calls/CallReturnDisplay";
import { CallStopHitNotice } from "@/components/calls/CallStopHitNotice";
import { CallSpotlightPrompt } from "@/components/calls/CallSpotlightPrompt";
import { normalizeCallCardPrices } from "@/lib/calls/card-display";
import { isCallStopHit } from "@/lib/calls/stop-cross";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { formatPublishedAt } from "@/lib/time/timestamp";
import { cn, timeAgo } from "@/lib/utils";

type ThesisCall = {
  id: string;
  user_id?: string;
  symbol?: string;
  asset_class?: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  peak_return_pct?: number | null;
  closed_at?: string | null;
  entry_price: number | null;
  price_at_call?: number | null;
  target_price: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  target_progress: number | null;
  timeframe_tag: string | null;
  live?: boolean;
  is_fueled: boolean;
  vote_score: number;
  comment_count: number;
  users: {
    display_name: string | null;
    pin: string;
    username?: string | null;
    trusted_at: string | null;
  };
};

export function CallThesisBlock({
  call,
  interactive,
  viewerUserId,
  isPro,
  showUpgrade,
  canGenerateSummary,
  isAdmin = false,
  showSymbol = false,
}: {
  call: ThesisCall;
  interactive: boolean;
  viewerUserId?: string | null;
  isPro?: boolean;
  showUpgrade?: boolean;
  canGenerateSummary?: boolean;
  isAdmin?: boolean;
  /** Show ticker symbol in header (e.g. chart modal); hidden on ticker page. */
  showSymbol?: boolean;
}) {
  const isOwnCall = Boolean(viewerUserId && call.user_id && viewerUserId === call.user_id);
  const canDelete = isAdmin;
  const canClose =
    (isAdmin || isOwnCall) &&
    !call.is_fueled &&
    !call.closed_at &&
    isOpenMemberCall({
      called_at: call.called_at,
      target_progress: call.target_progress,
      closed_at: call.closed_at,
    });
  const memberSlug =
    call.users.username && !/^\d{5}$/.test(call.users.username)
      ? call.users.username
      : null;
  const handle = call.users.username
    ? `@${call.users.username}`
    : /^\d{5}$/.test(call.users.pin)
      ? call.users.pin
      : `@${call.users.pin}`;
  const name = call.users.display_name ?? `Trader ${handle}`;
  const prices = normalizeCallCardPrices(call);
  const accent =
    call.direction === "long" ? "pf-ticker-thesis-long" : "pf-ticker-thesis-short";
  const stopHit = isCallStopHit({
    direction: call.direction,
    stop_price: prices.stop_price,
    last_price: prices.last_price,
    entry_price: prices.entry_price,
    price_at_call: call.price_at_call ?? null,
    closed_at: call.closed_at,
  });

  return (
    <article
      className={cn(
        "pf-ticker-thesis group overflow-hidden rounded-[var(--pf-radius-lg)] border shadow-[var(--pf-shadow-sm)] transition-shadow duration-200 hover:shadow-[var(--pf-shadow-md)]",
        accent,
        call.is_fueled
          ? "border-[var(--pf-red)]/40 bg-[var(--pf-surface)] ring-1 ring-[var(--pf-red)]/12"
          : "border-[var(--pf-border)] bg-[var(--pf-surface)]"
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--pf-border)] px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {showSymbol && call.symbol ? (
              <span className="font-mono text-sm font-bold tracking-tight text-[var(--pf-black)]">
                {call.symbol}
              </span>
            ) : null}
            {memberSlug ? (
              <Link
                href={`/member/${memberSlug}`}
                className="text-base font-bold tracking-tight text-[var(--pf-black)] hover:text-[var(--pf-red)]"
              >
                {name}
              </Link>
            ) : (
              <span className="text-base font-bold tracking-tight text-[var(--pf-black)]">
                {name}
              </span>
            )}
            <span className="text-xs font-medium tabular-nums text-[var(--pf-gray-400)]">
              {handle}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={call.direction === "long" ? "long" : "short"}>
              {call.direction}
            </Badge>
            {call.asset_class === "crypto" ? (
              <Badge variant="default">Crypto</Badge>
            ) : null}
            {call.is_fueled ? <Badge variant="fueled">Fueled</Badge> : null}
            {call.closed_at ? (
              <Badge
                variant="default"
                className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                Closed
              </Badge>
            ) : null}
            {stopHit ? (
              <Badge
                variant="default"
                className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              >
                Stop hit
              </Badge>
            ) : null}
            {call.users.trusted_at ? <Badge variant="trusted">Trusted</Badge> : null}
            {call.timeframe_tag ? (
              <span className="rounded-md bg-[var(--pf-gray-100)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
                {call.timeframe_tag}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
            Published {formatPublishedAt(call.called_at)} · {timeAgo(call.called_at)}
            {call.live ? (
              <span className="ml-2 inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live mark
              </span>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5">
          <CallReturnDisplay
            returnPct={call.return_pct}
            peakReturnPct={call.peak_return_pct}
            closedAt={call.closed_at}
          />
        </div>
      </header>

      <div className="px-5 py-4 sm:px-6">
        <p className="text-sm leading-[1.65] text-[var(--pf-gray-700)]">{call.thesis}</p>
        {interactive ? (
          <div className="mt-3">
            <ThesisSummaryExpand
              callId={call.id}
              canGenerate={Boolean(canGenerateSummary)}
              showUpgrade={showUpgrade}
            />
          </div>
        ) : null}
        {interactive && call.is_fueled ? (
          <div className="mt-2">
            <CallResearchExpand callId={call.id} />
          </div>
        ) : null}
      </div>

      <CallPriceMetrics
        entry_price={prices.entry_price}
        target_price={prices.target_price}
        stop_price={prices.stop_price}
        last_price={prices.last_price}
        target_progress={prices.target_progress}
        timeframe_tag={call.timeframe_tag}
        live={call.live}
        variant="strip"
      />

      {stopHit ? (
        <div className="border-t border-[var(--pf-border)] px-5 py-3 sm:px-6">
          <CallStopHitNotice
            call={{
              id: call.id,
              symbol: call.symbol ?? "",
              direction: call.direction,
              stop_price: prices.stop_price,
              last_price: prices.last_price,
              entry_price: prices.entry_price,
              price_at_call: call.price_at_call,
              closed_at: call.closed_at,
            }}
            showClose={canClose}
          />
        </div>
      ) : null}

      {isOwnCall && !call.is_fueled && !call.closed_at && call.symbol ? (
        <div className="border-t border-[var(--pf-border)] px-5 py-3 sm:px-6">
          <CallSpotlightPrompt
            callId={call.id}
            symbol={call.symbol}
            returnPct={call.return_pct}
          />
        </div>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pf-border)] bg-[var(--pf-gray-50)]/60 px-5 py-3 sm:px-6">
        <CallEngagement
          callId={call.id}
          initialVoteScore={call.vote_score}
          initialCommentCount={call.comment_count}
          interactive={interactive}
          compact
          embedded
        />
        {(canClose || canDelete) && call.symbol ? (
          <div className="flex flex-wrap items-center gap-1">
            {canClose ? (
              <CallCloseButton callId={call.id} symbol={call.symbol} stopHit={stopHit} />
            ) : null}
            {canDelete ? <CallDeleteButton callId={call.id} symbol={call.symbol} /> : null}
          </div>
        ) : null}
      </footer>

      {isOwnCall && call.symbol ? (
        <div className="border-t border-[var(--pf-border)] px-5 py-3 sm:px-6">
          <ThesisCoachInline
            isPro={Boolean(isPro)}
            showUpgrade={showUpgrade}
            draft={{
              symbol: call.symbol,
              assetClass: call.asset_class ?? "equity",
              direction: call.direction,
              thesis: call.thesis,
              entryPrice: prices.entry_price,
              targetPrice: call.target_price,
              stopPrice: call.stop_price ?? null,
              timeframeTag: call.timeframe_tag,
            }}
          />
        </div>
      ) : null}
    </article>
  );
}
