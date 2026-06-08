import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ThesisCoachInline } from "@/components/ai/ThesisCoachInline";
import { ThesisSummaryExpand } from "@/components/ai/ThesisSummaryExpand";
import { CallResearchExpand } from "@/components/calls/CallResearchExpand";
import { CallEngagement } from "@/components/calls/CallEngagement";
import { CallPriceMetrics } from "@/components/calls/CallPriceMetrics";
import { CallDeleteButton } from "@/components/calls/CallDeleteButton";
import { normalizeCallCardPrices } from "@/lib/calls/card-display";
import { cn, formatPct, timeAgo } from "@/lib/utils";

type ThesisCall = {
  id: string;
  user_id?: string;
  symbol?: string;
  asset_class?: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  entry_price: number | null;
  price_at_call?: number | null;
  target_price: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  target_progress: number | null;
  timeframe_tag: string | null;
  /** Set when return/last were recomputed from a fresh market quote on this page load. */
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
}: {
  call: ThesisCall;
  interactive: boolean;
  viewerUserId?: string | null;
  isPro?: boolean;
  showUpgrade?: boolean;
  canGenerateSummary?: boolean;
  isAdmin?: boolean;
}) {
  const isOwnCall = Boolean(viewerUserId && call.user_id && viewerUserId === call.user_id);
  const canDelete = Boolean(viewerUserId) && (isAdmin || isOwnCall);
  const handle = call.users.username
    ? `@${call.users.username}`
    : /^\d{5}$/.test(call.users.pin)
      ? call.users.pin
      : `@${call.users.pin}`;
  const name = call.users.display_name ?? `Trader ${handle}`;
  const ret = call.return_pct;
  const retClass =
    ret == null ? "text-[var(--pf-gray-500)]" : ret >= 0 ? "pf-return-up" : "pf-return-down";
  const prices = normalizeCallCardPrices(call);

  return (
    <article
      className={cn(
        "pf-call-card-premium rounded-[var(--pf-radius-lg)] border p-5 shadow-[var(--pf-shadow-sm)]",
        call.is_fueled
          ? "border-[var(--pf-red)] ring-1 ring-[var(--pf-red)]/15"
          : "border-[var(--pf-border)]"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {call.symbol ? (
          <Link
            href={`/ticker/${call.symbol}`}
            className="text-sm font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
          >
            {call.symbol}
          </Link>
        ) : null}
        {call.users.username && !/^\d{5}$/.test(call.users.username) ? (
          <Link
            href={`/member/${call.users.username}`}
            className="font-semibold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
          >
            {name}
          </Link>
        ) : (
          <span className="font-semibold text-[var(--pf-black)]">{name}</span>
        )}
        <span className="text-xs tabular-nums text-[var(--pf-gray-400)]">{handle}</span>
        <Badge variant={call.direction === "long" ? "long" : "short"}>{call.direction}</Badge>
        {call.is_fueled ? <Badge variant="fueled">Fueled</Badge> : null}
        {call.users.trusted_at ? <Badge variant="trusted">Trusted</Badge> : null}
        <span className={`ml-auto text-sm font-bold tabular-nums ${retClass}`}>
          {formatPct(ret)}
          {call.live ? (
            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              live
            </span>
          ) : null}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--pf-gray-400)]">{timeAgo(call.called_at)}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--pf-gray-700)]">{call.thesis}</p>
      {interactive ? (
        <ThesisSummaryExpand
          callId={call.id}
          canGenerate={Boolean(canGenerateSummary)}
          showUpgrade={showUpgrade}
        />
      ) : null}
      {interactive && call.is_fueled ? <CallResearchExpand callId={call.id} /> : null}
      <CallPriceMetrics
        entry_price={prices.entry_price}
        target_price={prices.target_price}
        stop_price={prices.stop_price}
        last_price={prices.last_price}
        target_progress={prices.target_progress}
        timeframe_tag={call.timeframe_tag}
        live={call.live}
        compact
      />
      {canDelete && call.symbol ? (
        <div className="mt-3 border-t border-[var(--pf-border)] pt-3">
          <CallDeleteButton callId={call.id} symbol={call.symbol} />
        </div>
      ) : null}
      <CallEngagement
        callId={call.id}
        initialVoteScore={call.vote_score}
        initialCommentCount={call.comment_count}
        interactive={interactive}
      />
      {isOwnCall && call.symbol ? (
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
      ) : null}
    </article>
  );
}
