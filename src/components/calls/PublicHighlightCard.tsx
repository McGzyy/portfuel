import Link from "next/link";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPct, timeAgo } from "@/lib/utils";
import type { TeaserCallRow } from "@/lib/db/supabase";
import { COPY } from "@/lib/copy";

/** Public landing card — shows performance, hides full thesis. */
export function PublicHighlightCard({ call }: { call: TeaserCallRow }) {
  const ret = call.return_pct;
  const retClass =
    ret == null ? "text-[var(--pf-gray-500)]" : ret >= 0 ? "pf-return-up" : "pf-return-down";
  const accent = call.direction === "long" ? "pf-call-accent-long" : "pf-call-accent-short";

  return (
    <Card className={cn(accent, "relative overflow-hidden transition-colors hover:border-[var(--pf-gray-200)]")}>
      <Link
        href={`/ticker/${call.symbol}`}
        className="absolute inset-0 z-0 rounded-[inherit]"
        aria-label={`View ${call.symbol} performance`}
      />
      <CardContent className="pointer-events-none py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold tracking-tight">{call.symbol}</span>
              <Badge variant={call.direction === "long" ? "long" : "short"}>
                {call.direction}
              </Badge>
              {call.asset_class === "crypto" ? <Badge variant="default">Crypto</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
              Verified member call · {timeAgo(call.called_at)}
            </p>
          </div>
          <p className={cn("text-xl font-bold tabular-nums", retClass)}>{formatPct(ret)}</p>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-6">
          <p className="select-none blur-sm">
            Full thesis and live levels are for members only. Join to read the complete call and
            track performance in real time.
          </p>
          <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[color-mix(in_srgb,var(--pf-surface)_70%,transparent)] backdrop-blur-[2px]">
            <Lock className="h-5 w-5 text-[var(--pf-red)]" strokeWidth={2} />
            <p className="text-xs font-semibold text-[var(--pf-gray-700)]">Members-only thesis</p>
            <Link href="/join">
              <Button size="sm">{COPY.ctaGetAccess}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
