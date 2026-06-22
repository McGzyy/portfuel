import { formatPublishedAt } from "@/lib/time/timestamp";
import { formatCallQuoteFreshnessLine } from "@/lib/market/quote-freshness";
import { cn, timeAgo } from "@/lib/utils";

function fullTimestamp(
  calledAt: string,
  updatedAt?: string | null,
  quoteUpdatedAt?: string | null
): string {
  const published = formatPublishedAt(calledAt);
  const parts = [`Published ${published}`];
  if (updatedAt) parts.push(`Marked ${formatPublishedAt(updatedAt)}`);
  if (quoteUpdatedAt) parts.push(`Price ${formatPublishedAt(quoteUpdatedAt)}`);
  return parts.join(" · ");
}

export function CallMarkedLabel({
  updatedAt,
  calledAt,
  quoteUpdatedAt,
  isPro,
  showQuoteFreshness = false,
  isClosed = false,
  className,
}: {
  updatedAt?: string | null;
  calledAt: string;
  quoteUpdatedAt?: string | null;
  isPro?: boolean;
  showQuoteFreshness?: boolean;
  isClosed?: boolean;
  className?: string;
}) {
  const published = timeAgo(calledAt);
  const mark = updatedAt ? timeAgo(updatedAt) : null;
  const quoteLine =
    showQuoteFreshness && !isClosed
      ? formatCallQuoteFreshnessLine({ updatedAt: quoteUpdatedAt, isPro })
      : null;

  return (
    <p
      className={cn(className, quoteLine?.includes("stale") && "text-amber-700/90")}
      title={fullTimestamp(calledAt, updatedAt, quoteUpdatedAt ?? undefined)}
    >
      <span className="text-[var(--pf-gray-400)]">{published}</span>
      {mark ? (
        <>
          <span className="text-[var(--pf-gray-300)]"> · </span>
          <span className="text-[var(--pf-gray-500)]">Mark {mark}</span>
        </>
      ) : null}
      {quoteLine ? (
        <>
          <span className="text-[var(--pf-gray-300)]"> · </span>
          <span className="text-[var(--pf-gray-500)]">{quoteLine}</span>
        </>
      ) : null}
    </p>
  );
}
