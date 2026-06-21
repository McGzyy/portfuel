"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiscoveryCandidateRow, DiscoverySignalType } from "@/lib/desk-discovery/types";
import {
  sortDiscoveryArchiveRows,
  type DiscoveryArchiveSortKey,
} from "@/lib/desk-discovery/candidate-sort";

const SIGNAL_LABELS: Record<DiscoverySignalType, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)] hover:text-[var(--pf-gray-600)]"
    >
      {label}
      <Icon className="h-3 w-3" strokeWidth={2.25} />
    </button>
  );
}

export function DiscoveryArchiveTable({
  rows,
  variant,
  onRestore,
}: {
  rows: DiscoveryCandidateRow[];
  variant: "published" | "snoozed" | "rejected";
  onRestore: (id: string, symbol: string) => Promise<void>;
}) {
  const [sortKey, setSortKey] = useState<DiscoveryArchiveSortKey>("updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: DiscoveryArchiveSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "score" ? "desc" : "desc");
    }
  }

  const sorted = useMemo(
    () => sortDiscoveryArchiveRows(rows, sortKey, sortDir),
    [rows, sortKey, sortDir]
  );

  const dateLabel =
    variant === "snoozed" ? "Snoozed until" : variant === "published" ? "Published" : "Updated";

  return (
    <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-2.5">
        <p className="text-xs font-semibold text-[var(--pf-gray-600)]">
          {sorted.length} {variant} {sorted.length === 1 ? "symbol" : "symbols"}
        </p>
        <p className="text-[10px] text-[var(--pf-gray-400)]">Click column headers to sort</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--pf-border)] bg-white">
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Symbol
              </th>
              <th className="px-4 py-2.5">
                <SortHeader
                  label="Score"
                  active={sortKey === "score"}
                  direction={sortDir}
                  onClick={() => toggleSort("score")}
                />
              </th>
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Headline
              </th>
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Signals
              </th>
              <th className="px-4 py-2.5">
                <SortHeader
                  label={dateLabel}
                  active={sortKey === "updated"}
                  direction={sortDir}
                  onClick={() => toggleSort("updated")}
                />
              </th>
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pf-border)]">
            {sorted.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--pf-gray-50)]/60">
                <td className="px-4 py-3 font-bold text-[var(--pf-black)]">
                  <Link href={`/ticker/${row.symbol}`} className="hover:text-[var(--pf-red)]">
                    {row.symbol}
                  </Link>
                  <span className="ml-1.5 text-[10px] font-medium uppercase text-[var(--pf-gray-400)]">
                    {row.assetClass}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-[var(--pf-red)]">
                  {row.score}
                </td>
                <td className="max-w-xs px-4 py-3 text-[var(--pf-gray-600)]">
                  <span className="line-clamp-2">
                    {row.headline ?? row.reasons[0]?.detail ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.signalTypes.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-[var(--pf-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--pf-gray-500)]"
                      >
                        {SIGNAL_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--pf-gray-500)]">
                  {variant === "snoozed" && row.snoozedUntil
                    ? fmtDate(row.snoozedUntil)
                    : fmtDate(row.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  {variant === "published" && row.publishedCallId ? (
                    <Link
                      href={`/ticker/${row.symbol}?call=${row.publishedCallId}`}
                      className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
                    >
                      View call →
                    </Link>
                  ) : variant !== "published" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => void onRestore(row.id, row.symbol)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <span className="text-xs text-[var(--pf-gray-400)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
