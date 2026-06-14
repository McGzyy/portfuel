import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import type { DeskPortfolioView } from "@/lib/desk/portfolio";
import { cn, formatPct, formatPrice, timeAgo } from "@/lib/utils";

function accentForReturn(ret: number | null) {
  if (ret == null) return "text-[var(--pf-gray-500)]";
  return ret >= 0 ? "pf-return-up" : "pf-return-down";
}

function convictionLabel(n: number) {
  if (n >= 5) return "Highest";
  if (n === 4) return "High";
  if (n === 3) return "Base";
  if (n === 2) return "Low";
  return "Starter";
}

export function DeskPortfolioPanel({
  entries,
  compact,
  deskHref = "/dashboard/desk",
}: {
  entries: DeskPortfolioView[];
  compact?: boolean;
  deskHref?: string;
}) {
  const open = entries.filter((e) => e.status === "open");
  const closed = entries.filter((e) => e.status === "closed");

  return (
    <WorkspacePanel
      title="Fueled model portfolio"
      subtitle="Desk-maintained theses with refreshed marks"
      href={deskHref}
      className="overflow-hidden"
      headerClassName="bg-[var(--pf-gray-50)]"
    >
      {open.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-[var(--pf-gray-500)]">
          No active desk positions yet.
        </div>
      ) : (
        <div className="divide-y divide-[var(--pf-border)]">
          {open.slice(0, compact ? 4 : 8).map((e) => (
            <div key={e.id} className="px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="fueled">Fueled</Badge>
                <span className="font-mono font-bold text-[var(--pf-black)]">
                  <Link href={`/ticker/${e.symbol}`} className="hover:text-[var(--pf-red)]">
                    {e.symbol}
                  </Link>
                </span>
                <Badge variant={e.direction === "long" ? "long" : "short"}>{e.direction}</Badge>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                  {e.asset_class}
                </span>
                <span className="ml-auto text-xs text-[var(--pf-gray-500)]">
                  Opened {timeAgo(e.opened_at)}
                </span>
              </div>

              <p className="mt-1.5 line-clamp-2 text-sm text-[var(--pf-gray-700)]">{e.thesis}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className={cn("font-bold tabular-nums", accentForReturn(e.return_pct))}>
                  {formatPct(e.return_pct)}
                </span>
                <span className="tabular-nums text-[var(--pf-gray-500)]">
                  Entry {formatPrice(e.entry_price)}
                </span>
                <span className="tabular-nums text-[var(--pf-gray-500)]">
                  Last {formatPrice(e.last_price)}
                </span>
                {e.target_price != null ? (
                  <span className="tabular-nums text-[var(--pf-gray-500)]">
                    Target {formatPrice(e.target_price)}
                  </span>
                ) : null}
                {e.stop_price != null ? (
                  <span className="tabular-nums text-[var(--pf-gray-500)]">
                    Stop {formatPrice(e.stop_price)}
                  </span>
                ) : null}
                <span className="text-[var(--pf-gray-500)]">
                  Conviction {e.conviction}/5 ({convictionLabel(e.conviction)})
                </span>
                {e.horizon_tag ? (
                  <span className="text-[var(--pf-gray-500)]">Horizon {e.horizon_tag}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {closed.length > 0 && !compact ? (
        <div className="border-t border-[var(--pf-border)] px-3 py-3 text-xs text-[var(--pf-gray-500)]">
          {closed.length} closed thesis{closed.length === 1 ? "" : "es"} archived.
        </div>
      ) : null}
    </WorkspacePanel>
  );
}

