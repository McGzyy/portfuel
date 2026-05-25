import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { formatPct } from "@/lib/utils";
import type { MemberTrackRecord } from "@/lib/users/member-track-record";

export function MemberTrackRecordStrip({ record }: { record: MemberTrackRecord }) {
  if (record.callCount === 0) return null;

  const avg = record.avgReturnPct;
  const avgAccent =
    avg == null ? undefined : avg >= 0 ? ("positive" as const) : ("negative" as const);
  const best = record.bestReturnPct;
  const bestAccent =
    best == null ? undefined : best >= 0 ? ("positive" as const) : ("negative" as const);

  return (
    <MetricsStrip
      eyebrow="Track record · published calls"
      items={[
        { label: "Calls", value: String(record.callCount) },
        {
          label: "Win rate",
          value:
            record.callCount > 0
              ? `${Math.round((record.winners / record.callCount) * 100)}%`
              : "—",
          hint: `${record.winners}W · ${record.losers}L`,
        },
        {
          label: "Avg return",
          value: formatPct(avg),
          accent: avgAccent,
        },
        {
          label: "Best call",
          value: formatPct(best),
          accent: bestAccent,
        },
        {
          label: "Long / short",
          value: `${record.longCount} / ${record.shortCount}`,
        },
      ]}
    />
  );
}
