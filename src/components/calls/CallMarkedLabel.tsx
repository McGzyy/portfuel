import { formatPublishedAt } from "@/lib/time/timestamp";
import { timeAgo } from "@/lib/utils";

function fullTimestamp(calledAt: string, updatedAt?: string | null): string {
  const published = formatPublishedAt(calledAt);
  if (updatedAt) {
    return `Published ${published} · Marked ${formatPublishedAt(updatedAt)}`;
  }
  return `Published ${published}`;
}

export function CallMarkedLabel({
  updatedAt,
  calledAt,
  className,
}: {
  updatedAt?: string | null;
  calledAt: string;
  className?: string;
}) {
  return (
    <p className={className} title={fullTimestamp(calledAt, updatedAt)}>
      <span className="text-[var(--pf-gray-400)]">{timeAgo(calledAt)}</span>
    </p>
  );
}
