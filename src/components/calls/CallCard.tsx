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
import { CallTargetProgressBar } from "@/components/calls/CallTargetProgressBar";
import { CallMarkedLabel } from "@/components/calls/CallMarkedLabel";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { CallStopHitNotice } from "@/components/calls/CallStopHitNotice";
import { CallTargetHitNotice } from "@/components/calls/CallTargetHitNotice";
import { CallCancelPendingButton } from "@/components/calls/CallCancelPendingButton";
import { CallSpotlightPrompt } from "@/components/calls/CallSpotlightPrompt";
import { CALL_CARD_INTERACTIVE } from "@/components/calls/call-card-link";
import { canCloseMemberCall } from "@/lib/calls/close-eligibility";
import { isCallStopHit } from "@/lib/calls/stop-cross";
import { isCallTargetHit } from "@/lib/calls/target-hit";
import { pendingEntryExpiryLabel, isPendingEntryExpiringSoon } from "@/lib/calls/pending-entry-display";
import { cn } from "@/lib/utils";
import type { TeaserCallRow } from "@/lib/db/supabase";

type CallCardExtras = {
  user_id?: string;
  username?: string | null;
  entry_price?: number | null;
  price_at_call?: number | null;
  target_price?: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  timeframe_tag?: string | null;
  peak_return_pct?: number | null;
  closed_at?: string | null;
  call_state?: string | null;
  trigger_entry_price?: number | null;
  expires_at?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
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
  /** Flat layout inside workspace panels (no nested card chrome). */
  embedded?: boolean;
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
  embedded = false,
}: CallCardProps) {
  const isOwnCall = Boolean(
    viewerUserId && call.user_id != null && call.user_id === viewerUserId
  );
  const canDelete = isAdmin;
  const handle = /^\d{5}$/.test(call.pin) ? call.pin : `@${call.pin}`;
  const name = call.display_name ?? `Trader ${handle}`;
  const isPending = call.call_state === "pending_entry";
  const expiryLabel = isPending ? pendingEntryExpiryLabel(call.expires_at) : null;
  const expirySoon = isPending && isPendingEntryExpiringSoon(call.expires_at);
  const canClose =
    (isAdmin || isOwnCall) &&
    canCloseMemberCall({
      is_fueled: call.is_fueled,
      closed_at: call.closed_at,
      call_state: call.call_state,
    });

  const accent =
    call.direction === "long" ? "pf-call-accent-long" : "pf-call-accent-short";

  const hasMetrics =
    call.entry_price != null ||
    call.trigger_entry_price != null ||
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

  const targetHit =
    !stopHit &&
    isCallTargetHit({
      closed_at: call.closed_at,
      target_price: call.target_price ?? null,
      target_progress: call.target_progress ?? null,
    });

  const progress =
    call.target_progress != null
      ? Math.min(100, Math.max(0, call.target_progress))
      : null;
  const showProgress = progress != null && !isPending && !call.closed_at;

  return (
    <Card
      className={cn(
        !embedded && accent,
        embedded
          ? "group relative pf-card-embedded"
          : "pf-call-card-premium group overflow-hidden transition-all duration-200",
        !embedded && call.is_fueled && "ring-2 ring-[var(--pf-red)]/35 shadow-[0_0_0_1px_rgba(227,27,35,0.12)]",
        isPending && !embedded && "border-amber-200/70 bg-amber-50/25",
        embedded && isPending && "rounded-lg bg-amber-50/40 px-1",
        linkToTicker
          ? "relative cursor-pointer"
          : undefined,
        !embedded && !linkToTicker && "hover:border-[var(--pf-gray-200)]",
        !embedded && linkToTicker && "hover:border-[var(--pf-gray-200)]"
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
        className={cn(
          embedded ? "p-0" : compact ? "px-4 py-3 sm:px-5 sm:py-4" : "px-5 py-4 sm:px-6 sm:py-5",
          linkToTicker && "pointer-events-none"
        )}
      >
        {/* Member identity */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <MemberAvatar
              displayName={call.display_name}
              username={call.username ?? call.pin.replace(/^@/, "")}
              avatarUrl={call.avatar_url}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {memberSlug(call) ? (
                  <Link
                    href={`/member/${memberSlug(call)}`}
                    className={cn(
                      CALL_CARD_INTERACTIVE,
                      "truncate text-sm font-semibold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                    )}
                  >
                    {name}
                  </Link>
                ) : (
                  <span className="truncate text-sm font-semibold text-[var(--pf-black)]">
                    {name}
                  </span>
                )}
                {call.is_trusted ? <Badge variant="trusted">Trusted</Badge> : null}
                {isNew ? (
                  <Badge variant="default" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                    New
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] tabular-nums text-[var(--pf-gray-400)]">{handle}</p>
            </div>
          </div>
          {showSparkline ? (
            <SymbolSparkline
              symbol={call.symbol}
              width={compact ? 64 : 72}
              height={compact ? 30 : 36}
              className="shrink-0 opacity-90"
            />
          ) : null}
        </div>

        {/* Symbol + return hero */}
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SymbolAvatar
                symbol={call.symbol}
                assetClass={"asset_class" in call ? call.asset_class : undefined}
                size="sm"
              />
              <span className="font-mono text-xl font-bold tracking-tight text-[var(--pf-black)] transition-colors group-hover:text-[var(--pf-red)] sm:text-2xl">
                {call.symbol}
              </span>
              <Badge variant={call.direction === "long" ? "long" : "short"}>
                {call.direction}
              </Badge>
              {"asset_class" in call && call.asset_class === "crypto" ? (
                <Badge variant="default">Crypto</Badge>
              ) : null}
              {call.is_fueled ? <Badge variant="fueled">Fueled</Badge> : null}
            </div>
            {(call.call_state === "pending_entry" ||
              expiryLabel ||
              (call.closed_at && call.call_state !== "pending_entry") ||
              stopHit ||
              targetHit ||
              ("hype_score" in call && call.hype_score != null && call.hype_score >= 15)) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {call.call_state === "pending_entry" ? (
                  <Badge
                    variant="default"
                    className="border-amber-200 bg-amber-50 text-amber-800"
                  >
                    Pending entry
                  </Badge>
                ) : null}
                {expiryLabel ? (
                  <Badge
                    variant="default"
                    className={cn(
                      expirySoon
                        ? "border-orange-200 bg-orange-50 text-orange-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    )}
                  >
                    {expiryLabel}
                  </Badge>
                ) : null}
                {call.closed_at && call.call_state !== "pending_entry" ? (
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
                {targetHit ? (
                  <Badge
                    variant="default"
                    className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    Target reached
                  </Badge>
                ) : null}
                {"hype_score" in call && call.hype_score != null && call.hype_score >= 15 ? (
                  <Badge variant="default">Hype {Math.round(call.hype_score)}</Badge>
                ) : null}
              </div>
            )}
          </div>
          <CallReturnDisplay
            returnPct={call.return_pct}
            peakReturnPct={call.peak_return_pct}
            closedAt={call.closed_at}
            callState={call.call_state}
            triggerEntryPrice={call.trigger_entry_price}
            size={compact ? "default" : "hero"}
            className="shrink-0"
          />
        </div>

        {showProgress ? (
          <CallTargetProgressBar progress={progress} className="mt-3" size={compact ? "slim" : "default"} />
        ) : null}

        <CallMarkedLabel
          updatedAt={call.updated_at}
          calledAt={call.called_at}
          className="mt-2 text-[10px]"
        />

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--pf-gray-700)]">
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
            callState={call.call_state}
            triggerEntryPrice={call.trigger_entry_price}
            compact={compact}
            showProgressBar={!showProgress}
          />
        ) : null}
        {stopHit ? (
          <CallStopHitNotice
            call={call}
            showClose={canClose}
            className={cn("mt-3", linkToTicker && CALL_CARD_INTERACTIVE)}
          />
        ) : null}
        {targetHit ? (
          <CallTargetHitNotice
            call={call}
            showClose={canClose}
            className={cn("mt-3", linkToTicker && CALL_CARD_INTERACTIVE)}
          />
        ) : null}
        {isOwnCall && !call.is_fueled && !call.closed_at && !isPending ? (
          <div className={cn("mt-3", linkToTicker && CALL_CARD_INTERACTIVE)}>
            <CallSpotlightPrompt
              callId={call.id}
              symbol={call.symbol}
              returnPct={call.return_pct}
            />
          </div>
        ) : null}
        {(canClose || canDelete || (isOwnCall && isPending)) && (
          <div
            className={cn(
              "mt-3 flex flex-wrap gap-2 border-t border-[var(--pf-border)] pt-3",
              linkToTicker && CALL_CARD_INTERACTIVE
            )}
          >
            {canClose ? (
              <CallCloseButton
                callId={call.id}
                symbol={call.symbol}
                stopHit={stopHit}
                targetHit={targetHit}
              />
            ) : null}
            {isOwnCall && isPending ? (
              <CallCancelPendingButton callId={call.id} symbol={call.symbol} />
            ) : null}
            {canDelete ? <CallDeleteButton callId={call.id} symbol={call.symbol} /> : null}
          </div>
        )}
        <div className={linkToTicker ? CALL_CARD_INTERACTIVE : undefined}>
          <CallEngagement
            callId={call.id}
            initialVoteScore={call.vote_score ?? 0}
            initialCommentCount={call.comment_count ?? 0}
            interactive={interactive}
            compact={compact}
            embedded={canClose || canDelete || (isOwnCall && isPending)}
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
