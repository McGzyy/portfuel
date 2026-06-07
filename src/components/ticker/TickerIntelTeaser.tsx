import type { AssetClass } from "@/lib/market/validate-symbol";
import type { IntelTeaserSummary } from "@/lib/market/intel-teaser";

export function TickerIntelTeaser({
  summary,
  assetClass = "equity",
}: {
  summary: IntelTeaserSummary;
  assetClass?: AssetClass;
}) {
  const pills: string[] = [];
  if (summary.headlineCount > 0) {
    pills.push(
      `${summary.headlineCount} headline${summary.headlineCount === 1 ? "" : "s"}`
    );
  }
  if (summary.earningsCount > 0) {
    pills.push(
      `${summary.earningsCount} earnings report${summary.earningsCount === 1 ? "" : "s"}`
    );
  }
  if (summary.filingsCount > 0) {
    pills.push(`${summary.filingsCount} SEC filing${summary.filingsCount === 1 ? "" : "s"}`);
  }
  if (summary.hasProfile) pills.push("Company stats");

  if (pills.length === 0) {
    return (
      <p className="text-sm text-[var(--pf-gray-600)]">
        {assetClass === "crypto"
          ? "Pro unlocks symbol-filtered crypto headlines and venue context on listed pairs."
          : "Pro unlocks news, earnings, SEC filings, and company stats on this ticker."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--pf-red-muted)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
          Pro preview
        </span>
        {pills.map((p) => (
          <span
            key={p}
            className="rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--pf-gray-700)]"
          >
            {p}
          </span>
        ))}
      </div>
      {summary.latestHeadline ? (
        <p className="text-sm text-[var(--pf-gray-600)]">
          <span className="font-medium text-[var(--pf-black)]">Latest headline: </span>
          <span className="pf-intel-teaser-headline">{summary.latestHeadline}</span>
          {summary.latestHeadlineSource ? (
            <span className="text-[var(--pf-gray-400)]"> · {summary.latestHeadlineSource}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
