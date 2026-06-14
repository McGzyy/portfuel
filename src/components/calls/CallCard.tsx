import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CallEngagement } from "@/components/calls/CallEngagement";
import { CallPriceMetrics } from "@/components/calls/CallPriceMetrics";
import { ThesisCoachInline } from "@/components/ai/ThesisCoachInline";
import { ThesisSummaryExpand } from "@/components/ai/ThesisSummaryExpand";
import { CallResearchExpand } from "@/components/calls/CallResearchExpand";
import { Card, CardContent } from "@/components/ui/card";
import { SymbolSparkline } from "@/components/charts/SymbolSparkline";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import { CallDeleteButton } from "@/components/calls/CallDeleteButton";
import { CallCloseButton } from "@/components/calls/CallCloseButton";
import { CallReturnDisplay } from "@/components/calls/CallReturnDisplay";
import { CallStopHitNotice } from "@/components/calls/CallStopHitNotice";
import { CallSpotlightPrompt } from "@/components/calls/CallSpotlightPrompt";
import { CALL_CARD_INTERACTIVE } from "@/components/calls/call-card-link";
import { isCallStopHit } from "@/lib/calls/stop-cross";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { formatPublishedAt } from "@/lib/time/timestamp";
import { cn, timeAgo } from "@/lib/utils";
import type { TeaserCallRow } from "@/lib/db/supabase";

type CallCardExtras = {
  user_id?: string;
  username?: string | null;
  entry_price?: number | null;
  target_price?: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  timeframe_tag?: string | null;
  peak_return_pct?: number | null;
  closed_at?: string | null;
};

export type CallCardData = (TeaserCallRow | {
  id: string;
  symbol: string;
  asset_class?: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  is_fueled: boolean;
  vote_score?: number;
  comment_count?: number;
  display_name: string | null;
  pin: string;
  is_trusted?: boolean;
  target_progress?: number | null;
  hype_score?: number | null;
}) &
  CallCardExtras;

function memberSlug(call: CallCardData): string | null {
  const u = call.username ?? (/^\d{5}$/.test(call.pin) ? null : call.pin.replace(/^@/, ""));
  return u && u.length >= 2 ? u : null;
}

type CallCardProps = {
  call: CallCardData;
  compact?: boolean;
  interactive?: boolean;
  isNew?: boolean;
  showThesisCoach?: boolean;
  isPro?: boolean;
  showUpgrade?: boolean;
  showSummary?: boolean;
  canGenerateSummary?: boolean;
  /** Requires SparklineProvider ancestor — lazy-loaded on feed. */
  showSparkline?: boolean;
  viewerUserId?: string | null;
  isAdmin?: boolean;
  /** Whole card navigates to the ticker page (default). Disable for publish preview. */
  linkToTicker?: boolean;
};

export function CallCard({
  call,
  compact,
  interactive = false,
  isNew,
  showThesisCoach,
  isPro,
  showUpgrade,
  showSummary = true,
  canGenerateSummary = false,
  showSparkline = false,
  viewerUserId,
  isAdmin = false,
  linkToTicker = true,
}: CallCardProps) {
  const isOwnCall = Boolean(
    viewerUserId && call.user_id != null && call.user_id === viewerUserId
  );
  const canDelete = isAdmin;
  const handle = /^\d{5}$/.test(call.pin) ? call.pin : `@${call.pin}`;
  const name = call.display_name ?? `Trader ${handle}`;
  const canClose =
    (isAdmin || isOwnCall) &&
    !call.is_fueled &&
    !call.closed_at &&
    isOpenMemberCall({
      called_at: call.called_at,
      target_progress: call.target_progress,
      closed_at: call.closed_at,
    });

  const accent =
    call.direction === "long" ? "pf-call-accent-long" : "pf-call-accent-short";

  const hasMetrics =
    call.entry_price != null ||
    call.target_price != null ||
    call.stop_price != null ||
    call.last_price != null ||
    call.target_progress != null ||
    call.timeframe_tag;

  const stopHit =
    !call.closed_at &&
    isCallStopHit({
      direction: call.direction,
      stop_price: call.stop_price ?? null,
      last_price: call.last_price ?? null,
      entry_price: call.entry_price ?? null,
      price_at_call: null,
      closed_at: call.closed_at,
    });

  return (
    <Card
      className={cn(
        accent,
        "pf-call-card-premium group overflow-hidden transition-all duration-200",
        call.is_fueled && "ring-2 ring-[var(--pf-red)]/35 shadow-[0_0_0_1px_rgba(227,27,35,0.12)]",
        linkToTicker
          ? "relative cursor-pointer hover:border-[var(--pf-gray-200)]"
          : "hover:border-[var(--pf-gray-200)]"
      )}
    >
      {linkToTicker ? (
        <Link
          href={`/ticker/${call.symbol}`}
          className="absolute inset-0 z-0 rounded-[inherit]"
          aria-label={`View ${call.symbol} chart and thesis`}
        />
      ) : null}
      <CardContent
        className={cn(compact ? "py-3" : "py-5", linkToTicker && "pointer-events-none")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SymbolAvatar
                symbol={call.symbol}
                assetClass={"asset_class" in call ? call.asset_class : undefined}
                size="sm"
              />
              <span className="text-lg font-bold tracking-tight text-[var(--pf-black)] transition-colors group-hover:text-[var(--pf-red)]">
                {call.symbol}
              </span>
              <Badge variant={call.direction === "long" ? "long" : "short"}>
                {call.direction}
              </Badge>
              {"asset_class" in call && call.asset_class === "crypto" ? (
                <Badge variant="default">Crypto</Badge>
              ) : null}
              {call.is_fueled ? <Badge variant="fueled">Fueled</Badge> : null}
              {call.closed_at ? (
                <Badge variant="default" className="border-slate-200 bg-slate-100 text-slate-700">
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
              {call.is_trusted ? <Badge variant="trusted">Trusted</Badge> : null}
              {isNew ? (
                <Badge variant="default" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                  New
                </Badge>
              ) : null}
              {"hype_score" in call && call.hype_score != null && call.hype_score >= 15 ? (
                <Badge variant="default">Hype {Math.round(call.hype_score)}</Badge>
              ) : null}
              {call.timeframe_tag && !hasMetrics ? (
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">
                  {call.timeframe_tag}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-[var(--pf-gray-600)]">
              {memberSlug(call) ? (
                <Link
                  href={`/member/${memberSlug(call)}`}
                  className={cn(
                    CALL_CARD_INTERACTIVE,
                    "font-semibold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                  )}
                >
                  {name}
                </Link>
              ) : (
                <span className="font-semibold text-[var(--pf-black)]">{name}</span>
              )}{" "}
              <span className="tabular-nums text-[var(--pf-gray-400)]">· {handle}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-2.5">
            {showSparkline ? (
              <SymbolSparkline symbol={call.symbol} width={56} height={28} className="mt-0.5" />
            ) : null}
            <div className="text-right">
              <CallReturnDisplay
                returnPct={call.return_pct}
                peakReturnPct={call.peak_return_pct}
                closedAt={call.closed_at}
              />
              <p className="text-xs text-[var(--pf-gray-400)]">
                {formatPublishedAt(call.called_at)} · {timeAgo(call.called_at)}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--pf-gray-700)]">
          {call.thesis}
        </p>
        {showSummary ? (
          <div className={linkToTicker ? CALL_CARD_INTERACTIVE : undefined}>
            <ThesisSummaryExpand
              callId={call.id}
              canGenerate={canGenerateSummary}
              showUpgrade={showUpgrade}
            />
          </div>
        ) : null}
        {call.is_fueled && interactive ? (
          <div className={linkToTicker ? CALL_CARD_INTERACTIVE : undefined}>
            <CallResearchExpand callId={call.id} />
          </div>
        ) : null}
        {hasMetrics ? (
          <CallPriceMetrics
            entry_price={call.entry_price}
            target_price={call.target_price}
            stop_price={call.stop_price}
            last_price={call.last_price}
            target_progress={call.target_progress}
            timeframe_tag={call.timeframe_tag}
            compact={compact}
          />
        ) : null}
        {stopHit ? (
          <CallStopHitNotice
            call={call}
            showClose={canClose}
            className={cn("mt-3", linkToTicker && CALL_CARD_INTERACTIVE)}
          />
        ) : null}
        {isOwnCall && !call.is_fueled && !call.closed_at ? (
          <div className={cn("mt-3", linkToTicker && CALL_CARD_INTERACTIVE)}>
            <CallSpotlightPrompt
              callId={call.id}
              symbol={call.symbol}
              returnPct={call.return_pct}
            />
          </div>
        ) : null}
        <div
          className={cn(
            "mt-3 flex flex-wrap items-center justify-between gap-2",
            linkToTicker && CALL_CARD_INTERACTIVE
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[var(--pf-red)] group-hover:text-[var(--pf-red-hover)]">
              Chart & intel →
            </span>
            {canClose ? (
              <CallCloseButton callId={call.id} symbol={call.symbol} stopHit={stopHit} />
            ) : null}
            {canDelete ? (
              <CallDeleteButton callId={call.id} symbol={call.symbol} />
            ) : null}
          </div>
          {(call.vote_score ?? 0) !== 0 || (call.comment_count ?? 0) > 0 ? (
            <span className="text-[10px] tabular-nums text-[var(--pf-gray-400)]">
              {(call.vote_score ?? 0) > 0 ? "+" : ""}
              {call.vote_score ?? 0} score · {call.comment_count ?? 0} comments
            </span>
          ) : null}
        </div>
        <div className={linkToTicker ? CALL_CARD_INTERACTIVE : undefined}>
          <CallEngagement
            callId={call.id}
            initialVoteScore={call.vote_score ?? 0}
            initialCommentCount={call.comment_count ?? 0}
            interactive={interactive}
            compact={compact}
          />
        </div>
        {showThesisCoach ? (
          <div className={linkToTicker ? CALL_CARD_INTERACTIVE : undefined}>
            <ThesisCoachInline
            isPro={Boolean(isPro)}
            showUpgrade={showUpgrade}
            draft={{
              symbol: call.symbol,
              assetClass: (call.asset_class ?? "equity") as "equity" | "crypto",
              direction: call.direction,
              thesis: call.thesis,
              entryPrice: call.entry_price ?? null,
              targetPrice: call.target_price ?? null,
              stopPrice: call.stop_price ?? null,
              timeframeTag: call.timeframe_tag ?? null,
            }}
          />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
