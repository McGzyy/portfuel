import Link from "next/link";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";
import { cn, formatPct } from "@/lib/utils";

function HighlightCard({
  label,
  symbol,
  returnPct,
  tone,
}: {
  label: string;
  symbol: string;
  returnPct: number;
  tone: "up" | "down";
}) {
  return (
    <Link
      href={`/ticker/${symbol}`}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-[var(--pf-radius-lg)] border px-4 py-3.5 shadow-[var(--pf-shadow-sm)] transition-all hover:shadow-[var(--pf-shadow-md)]",
        tone === "up"
          ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300"
          : "border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white hover:border-rose-300"
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
          {label}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <SymbolAvatar symbol={symbol} size="xs" />
          <span className="font-mono text-lg font-bold text-[var(--pf-black)] group-hover:text-[var(--pf-red)]">
            {symbol}
          </span>
        </div>
      </div>
      <p
        className={cn(
          "text-2xl font-extrabold tabular-nums tracking-tight",
          tone === "up" ? "pf-return-up" : "pf-return-down"
        )}
      >
        {formatPct(returnPct)}
      </p>
    </Link>
  );
}

export function PositionsHighlightCards({
  best,
  worst,
}: {
  best: MemberOpenBookSummary["best"];
  worst: MemberOpenBookSummary["worst"];
}) {
  if (!best && !worst) return null;
  const samePick = best && worst && best.symbol === worst.symbol && best.returnPct === worst.returnPct;

  return (
    <div className={cn("grid gap-3", samePick ? "grid-cols-1" : "sm:grid-cols-2")}>
      {best ? (
        <HighlightCard label="Best open" symbol={best.symbol} returnPct={best.returnPct} tone="up" />
      ) : null}
      {worst && !samePick ? (
        <HighlightCard
          label="Weakest open"
          symbol={worst.symbol}
          returnPct={worst.returnPct}
          tone="down"
        />
      ) : null}
    </div>
  );
}
