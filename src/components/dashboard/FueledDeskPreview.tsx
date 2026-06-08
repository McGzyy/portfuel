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
    <div className="mt-5 space-y-4">
      {weeklyNote ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Desk note · this week
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            {weeklyNote.length > 200 ? `${weeklyNote.slice(0, 197)}…` : weeklyNote}
          </p>
        </div>
      ) : null}

      {featured ? (
        <Link
          href={`/ticker/${featured.symbol}`}
          className="block rounded-lg border border-white/10 bg-black/20 p-4 transition-colors hover:bg-white/5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="fueled">
              <Flame className="mr-1 h-3 w-3" />
              Fueled
            </Badge>
            <span className="font-mono text-base font-bold text-white">
              {featured.symbol}
            </span>
            <span className="text-xs font-semibold uppercase text-slate-400">
              {featured.direction}
            </span>
            {featured.return_pct != null ? (
              <span
                className={
                  featured.return_pct >= 0
                    ? "ml-auto text-sm font-bold tabular-nums text-emerald-400"
                    : "ml-auto text-sm font-bold tabular-nums text-rose-400"
                }
              >
                {formatPct(featured.return_pct)}
              </span>
            ) : null}
          </div>
          {thesisPreview ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{thesisPreview}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            {timeAgo(featured.called_at)}
            {totalDeskCalls > 1 ? ` · ${totalDeskCalls} desk calls` : ""}
          </p>
        </Link>
      ) : (
        <div className="rounded-lg border border-dashed border-white/20 px-4 py-8 text-center text-sm text-slate-400">
          <p className="font-medium text-slate-300">No desk thesis yet</p>
          <p className="mt-1 text-xs leading-relaxed">
            House research appears here when published. Browse the{" "}
            <Link href="/dashboard/desk" className="font-semibold text-sky-300 hover:text-sky-200 hover:underline">
              Fueled desk
            </Link>{" "}
            or the{" "}
            <Link href="/dashboard/feed" className="font-semibold text-sky-300 hover:text-sky-200 hover:underline">
              member feed
            </Link>{" "}
            for community ideas.
          </p>
        </div>
      )}
    </div>
  );
}
