import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CallEngagement } from "@/components/calls/CallEngagement";
import { CallPriceMetrics } from "@/components/calls/CallPriceMetrics";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPct, timeAgo } from "@/lib/utils";
import type { TeaserCallRow } from "@/lib/db/supabase";

type CallCardExtras = {
  entry_price?: number | null;
  target_price?: number | null;
  stop_price?: number | null;
  last_price?: number | null;
  timeframe_tag?: string | null;
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
}) &
  CallCardExtras;

type CallCardProps = {
  call: CallCardData;
  compact?: boolean;
  interactive?: boolean;
};

export function CallCard({ call, compact, interactive = false }: CallCardProps) {
  const handle = /^\d{5}$/.test(call.pin) ? call.pin : `@${call.pin}`;
  const name = call.display_name ?? `Trader ${handle}`;
  const ret = call.return_pct;
  const retClass =
    ret == null
      ? "text-[var(--pf-gray-500)]"
      : ret >= 0
        ? "text-emerald-600"
        : "text-rose-600";

  const accent =
    call.direction === "long" ? "pf-call-accent-long" : "pf-call-accent-short";

  const hasMetrics =
    call.entry_price != null ||
    call.target_price != null ||
    call.stop_price != null ||
    call.last_price != null ||
    call.target_progress != null ||
    call.timeframe_tag;

  return (
    <Card
      className={cn(
        accent,
        "group overflow-hidden transition-all duration-200",
        call.is_fueled && "ring-1 ring-[var(--pf-red)]/20",
        "hover:border-[var(--pf-gray-200)] hover:shadow-[var(--pf-shadow-md)]"
      )}
    >
      <CardContent className={compact ? "py-3" : "py-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/ticker/${call.symbol}`}
                className="text-lg font-bold tracking-tight text-[var(--pf-black)] transition-colors group-hover:text-[var(--pf-red)]"
              >
                {call.symbol}
              </Link>
              <Badge variant={call.direction === "long" ? "long" : "short"}>
                {call.direction}
              </Badge>
              {"asset_class" in call && call.asset_class === "crypto" ? (
                <Badge variant="default">Crypto</Badge>
              ) : null}
              {call.is_fueled ? <Badge variant="fueled">Fueled</Badge> : null}
              {call.is_trusted ? <Badge variant="trusted">Trusted</Badge> : null}
              {call.timeframe_tag && !hasMetrics ? (
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-400)]">
                  {call.timeframe_tag}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-[var(--pf-gray-600)]">
              {name}{" "}
              <span className="tabular-nums text-[var(--pf-gray-400)]">· {handle}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("text-xl font-bold tabular-nums tracking-tight", retClass)}>
              {formatPct(ret)}
            </p>
            <p className="text-xs text-[var(--pf-gray-400)]">{timeAgo(call.called_at)}</p>
          </div>
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--pf-gray-700)]">
          {call.thesis}
        </p>
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
        <div className="mt-3 flex items-center justify-between gap-2">
          <Link
            href={`/ticker/${call.symbol}`}
            className="text-xs font-semibold text-[var(--pf-red)] transition-colors hover:text-[var(--pf-red-hover)]"
          >
            Chart & intel →
          </Link>
          {(call.vote_score ?? 0) !== 0 || (call.comment_count ?? 0) > 0 ? (
            <span className="text-[10px] tabular-nums text-[var(--pf-gray-400)]">
              {(call.vote_score ?? 0) > 0 ? "+" : ""}
              {call.vote_score ?? 0} score · {call.comment_count ?? 0} comments
            </span>
          ) : null}
        </div>
        <CallEngagement
          callId={call.id}
          initialVoteScore={call.vote_score ?? 0}
          initialCommentCount={call.comment_count ?? 0}
          interactive={interactive}
          compact={compact}
        />
      </CardContent>
    </Card>
  );
}
