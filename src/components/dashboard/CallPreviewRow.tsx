"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SymbolSparkline } from "@/components/charts/SymbolSparkline";
import { cn, formatPct, timeAgo } from "@/lib/utils";

export type CallPreviewData = {
  id: string;
  symbol: string;
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  display_name: string | null;
  username?: string | null;
  is_fueled?: boolean;
};

export function CallPreviewRow({
  call,
  variant = "default",
  showSparkline = false,
}: {
  call: CallPreviewData;
  variant?: "default" | "on-dark";
  showSparkline?: boolean;
}) {
  const slug = call.username && !/^\d{5}$/.test(call.username) ? call.username : null;
  const name = call.display_name ?? (slug ? `@${slug}` : "Member");
  const ret = call.return_pct;
  const dark = variant === "on-dark";

  return (
    <Link
      href={`/ticker/${call.symbol}`}
      className={cn(
        "pf-preview-row group block",
        dark && "pf-preview-row-dark"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-mono text-sm font-bold tracking-tight",
              dark ? "text-white" : "text-[var(--pf-black)] group-hover:text-[var(--pf-red)]"
            )}
          >
            {call.symbol}
          </span>
          <Badge variant={call.direction === "long" ? "long" : "short"}>
            {call.direction}
          </Badge>
          {call.is_fueled ? <Badge variant="fueled">Fueled</Badge> : null}
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {showSparkline ? (
            <SymbolSparkline symbol={call.symbol} width={48} height={22} className="mt-0.5" />
          ) : null}
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                ret == null
                  ? dark
                    ? "text-slate-500"
                    : "text-[var(--pf-gray-400)]"
                  : ret >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
              )}
            >
              {formatPct(ret)}
            </p>
            <p className={cn("text-[10px]", dark ? "text-slate-500" : "text-[var(--pf-gray-400)]")}>
              {timeAgo(call.called_at)}
            </p>
          </div>
        </div>
      </div>
      <p
        className={cn(
          "mt-2 line-clamp-1 text-xs leading-relaxed",
          dark ? "text-slate-400" : "text-[var(--pf-gray-600)]"
        )}
      >
        {call.thesis}
      </p>
      <p className={cn("mt-1.5 text-[10px]", dark ? "text-slate-500" : "text-[var(--pf-gray-400)]")}>
        {slug ? (
          <span className={dark ? "text-slate-300" : "text-[var(--pf-gray-500)]"}>{name}</span>
        ) : (
          name
        )}
      </p>
    </Link>
  );
}
