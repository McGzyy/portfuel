import { Badge } from "@/components/ui/badge";
import { CallEngagement } from "@/components/calls/CallEngagement";
import { formatPct, formatPrice, timeAgo } from "@/lib/utils";

type ThesisCall = {
  id: string;
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  entry_price: number | null;
  target_price: number | null;
  target_progress: number | null;
  timeframe_tag: string | null;
  is_fueled: boolean;
  vote_score: number;
  comment_count: number;
  users: {
    display_name: string | null;
    pin: string;
    trusted_at: string | null;
  };
};

export function CallThesisBlock({
  call,
  interactive,
}: {
  call: ThesisCall;
  interactive: boolean;
}) {
  const name = call.users.display_name ?? `Trader ${call.users.pin}`;
  const ret = call.return_pct;
  const retClass =
    ret == null ? "text-[var(--pf-gray-500)]" : ret >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <article
      className={`rounded-[var(--pf-radius-lg)] border bg-white p-5 shadow-[var(--pf-shadow-sm)] ${
        call.is_fueled ? "border-[var(--pf-red)] ring-1 ring-[var(--pf-red)]/15" : "border-[var(--pf-border)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[var(--pf-black)]">{name}</span>
        <span className="text-xs tabular-nums text-[var(--pf-gray-400)]">{call.users.pin}</span>
        <Badge variant={call.direction === "long" ? "long" : "short"}>{call.direction}</Badge>
        {call.is_fueled ? <Badge variant="fueled">Fueled</Badge> : null}
        {call.users.trusted_at ? <Badge variant="trusted">Trusted</Badge> : null}
        <span className={`ml-auto text-sm font-bold tabular-nums ${retClass}`}>
          {formatPct(ret)}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--pf-gray-400)]">{timeAgo(call.called_at)}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--pf-gray-700)]">{call.thesis}</p>
      {(call.entry_price || call.target_price) && (
        <p className="mt-2 text-xs text-[var(--pf-gray-500)]">
          {call.entry_price ? `Entry $${formatPrice(Number(call.entry_price))}` : ""}
          {call.target_price ? ` · Target $${formatPrice(Number(call.target_price))}` : ""}
          {call.target_progress != null ? ` · ${call.target_progress.toFixed(0)}% to target` : ""}
        </p>
      )}
      {call.timeframe_tag ? (
        <p className="mt-1 text-xs text-[var(--pf-gray-400)]">{call.timeframe_tag}</p>
      ) : null}
      <CallEngagement
        callId={call.id}
        initialVoteScore={call.vote_score}
        initialCommentCount={call.comment_count}
        interactive={interactive}
      />
    </article>
  );
}
