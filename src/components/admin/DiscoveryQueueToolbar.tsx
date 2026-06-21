"use client";

import type { DiscoverySortMode } from "@/lib/desk-discovery/candidate-sort";

const SORT_OPTIONS: { id: DiscoverySortMode; label: string }[] = [
  { id: "score", label: "Score" },
  { id: "earnings", label: "Earnings soon" },
  { id: "symbol", label: "Symbol A–Z" },
];

export function DiscoveryQueueToolbar({
  sort,
  onSortChange,
  highPriorityOnly,
  onHighPriorityOnlyChange,
  highPriorityCount,
  totalCount,
}: {
  sort: DiscoverySortMode;
  onSortChange: (sort: DiscoverySortMode) => void;
  highPriorityOnly: boolean;
  onHighPriorityOnlyChange: (value: boolean) => void;
  highPriorityCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-4 py-3 shadow-[var(--pf-shadow-sm)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Sort
        </span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSortChange(opt.id)}
            className={
              sort === opt.id
                ? "rounded-full border border-[var(--pf-red)] bg-[var(--pf-red-muted)] px-2.5 py-1 text-xs font-bold text-[var(--pf-red)]"
                : "rounded-full border border-[var(--pf-border)] px-2.5 py-1 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
      {highPriorityCount > 0 ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--pf-gray-600)]">
          <input
            type="checkbox"
            checked={highPriorityOnly}
            onChange={(e) => onHighPriorityOnlyChange(e.target.checked)}
            className="rounded border-[var(--pf-border)] text-[var(--pf-red)] focus:ring-[var(--pf-red)]"
          />
          High priority only ({highPriorityCount})
        </label>
      ) : (
        <span className="text-xs text-[var(--pf-gray-500)]">{totalCount} in queue</span>
      )}
    </div>
  );
}

export function DiscoveryQueueListHeader({ count, filterLabel }: { count: number; filterLabel: string }) {
  return (
    <div className="flex items-center justify-between px-1 text-xs text-[var(--pf-gray-500)]">
      <span>
        {count} {filterLabel}
      </span>
      <span className="hidden sm:inline">Expand one row at a time to edit drafts</span>
    </div>
  );
}
