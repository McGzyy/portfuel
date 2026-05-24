import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPct, timeAgo } from "@/lib/utils";
import type { TeaserCallRow } from "@/lib/db/supabase";

type CallCardProps = {
  call: TeaserCallRow | {
    id: string;
    symbol: string;
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
  };
  compact?: boolean;
};

export function CallCard({ call, compact }: CallCardProps) {
  const name = call.display_name ?? `Trader ${call.pin}`;
  const ret = call.return_pct;
  const retClass =
    ret == null
      ? "text-[var(--pf-gray-500)]"
      : ret >= 0
        ? "text-emerald-600"
        : "text-rose-600";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className={compact ? "py-3" : "py-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/ticker/${call.symbol}`}
                className="text-lg font-bold tracking-tight text-[var(--pf-black)] hover:text-[var(--pf-red)]"
              >
                {call.symbol}
              </Link>
              <Badge variant={call.direction === "long" ? "long" : "short"}>
                {call.direction}
              </Badge>
              {"asset_class" in call && call.asset_class === "crypto" ? (
                <Badge variant="fueled">CRYPTO</Badge>
              ) : null}
              {call.is_fueled ? <Badge variant="fueled">FUELED</Badge> : null}
              {call.is_trusted ? <Badge variant="trusted">Trusted</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
              {name} · <span className="tabular-nums text-[var(--pf-gray-400)]">{call.pin}</span>
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-lg font-bold tabular-nums", retClass)}>
              {formatPct(ret)}
            </p>
            <p className="text-xs text-[var(--pf-gray-400)]">{timeAgo(call.called_at)}</p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--pf-gray-700)]">
          {call.thesis}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--pf-gray-400)]">
          <span>
            {call.vote_score != null ? `${call.vote_score} votes` : ""}
            {call.comment_count != null && call.comment_count > 0
              ? ` · ${call.comment_count} comments`
              : ""}
          </span>
          <Link
            href={`/ticker/${call.symbol}`}
            className="font-medium text-[var(--pf-red)] hover:underline"
          >
            View chart →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
