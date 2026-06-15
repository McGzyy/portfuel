import { formatPublishedAt } from "@/lib/time/timestamp";
import { timeAgo } from "@/lib/utils";

export function CallMarkedLabel({
  updatedAt,
  calledAt,
  className,
}: {
  updatedAt?: string | null;
  calledAt: string;
  className?: string;
}) {
  const marked = updatedAt ? timeAgo(updatedAt) : null;

  return (
    <p className={className}>
      {marked ? (
        <>
          <span className="font-medium text-[var(--pf-gray-500)]">Marked {marked}</span>
          <span className="text-[var(--pf-gray-300)]"> · </span>
        </>
      ) : null}
      <span className="text-[var(--pf-gray-400)]">
        {formatPublishedAt(calledAt)} · {timeAgo(calledAt)}
      </span>
    </p>
  );
}
