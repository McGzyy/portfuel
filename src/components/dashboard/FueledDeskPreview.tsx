import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import { formatPct, timeAgo } from "@/lib/utils";

export function FueledDeskPreview({
  featured,
  totalDeskCalls,
  weeklyNote,
}: {
  featured: CallPreviewData | null;
  totalDeskCalls: number;
  weeklyNote?: string | null;
}) {
  const thesisPreview =
    featured?.thesis && featured.thesis.length > 140
      ? `${featured.thesis.slice(0, 137)}…`
      : featured?.thesis;

  return (
    <div className="space-y-4 px-3 pb-3">
      {weeklyNote ? (
        <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Desk note · this week
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--pf-gray-700)]">
            {weeklyNote.length > 200 ? `${weeklyNote.slice(0, 197)}…` : weeklyNote}
          </p>
        </div>
      ) : null}

      {featured ? (
        <Link
          href={`/ticker/${featured.symbol}`}
          className="block rounded-lg border border-[var(--pf-border)] p-4 transition-colors hover:bg-[var(--pf-gray-50)]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="fueled">
              <Flame className="mr-1 h-3 w-3" />
              Fueled
            </Badge>
            <span className="font-mono text-base font-bold text-[var(--pf-black)]">
              {featured.symbol}
            </span>
            <span className="text-xs font-semibold uppercase text-[var(--pf-gray-500)]">
              {featured.direction}
            </span>
            {featured.return_pct != null ? (
              <span
                className={
                  featured.return_pct >= 0
                    ? "ml-auto text-sm font-bold tabular-nums text-[var(--pf-positive)]"
                    : "ml-auto text-sm font-bold tabular-nums text-[var(--pf-negative)]"
                }
              >
                {formatPct(featured.return_pct)}
              </span>
            ) : null}
          </div>
          {thesisPreview ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">{thesisPreview}</p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--pf-gray-400)]">
            {timeAgo(featured.called_at)}
            {totalDeskCalls > 1 ? ` · ${totalDeskCalls} desk calls` : ""}
          </p>
        </Link>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--pf-border)] px-4 py-8 text-center text-sm text-[var(--pf-gray-500)]">
          No desk thesis yet — browse the member feed for community ideas.
        </p>
      )}
    </div>
  );
}
