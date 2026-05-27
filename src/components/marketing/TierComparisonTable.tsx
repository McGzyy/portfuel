import { Check, Minus } from "lucide-react";
import type { MembershipTier } from "@/lib/stripe/config";
import { formatTierColumnHeader, PLAN_BY_TIER, type TierComparisonRow } from "@/lib/marketing/plans";
import { cn } from "@/lib/utils";

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-[var(--pf-red)]" strokeWidth={2.5} />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-[var(--pf-gray-300)]" strokeWidth={2} />;
  }
  return <span className="text-sm font-semibold tabular-nums text-[var(--pf-black)]">{value}</span>;
}

export function TierComparisonTable({
  rows,
  highlightTier,
  compact,
}: {
  rows: TierComparisonRow[];
  /** Emphasize Member or Pro column (e.g. on /join when a plan is selected) */
  highlightTier?: MembershipTier;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
      <table className={cn("w-full text-left", compact ? "text-xs" : "text-sm")}>
        <thead>
          <tr className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            <th className={cn("text-left", compact ? "px-3 py-2" : "px-4 py-3")}>Feature</th>
            <th
              className={cn(
                "text-center",
                compact ? "px-3 py-2" : "px-4 py-3",
                highlightTier === "member" && "bg-[var(--pf-red-muted)]/50 text-[var(--pf-red)]"
              )}
            >
              {formatTierColumnHeader("member")}
            </th>
            <th
              className={cn(
                "text-center",
                compact ? "px-3 py-2" : "px-4 py-3",
                highlightTier === "pro"
                  ? "bg-[var(--pf-red-muted)]/50 text-[var(--pf-red)]"
                  : "text-[var(--pf-red)]"
              )}
            >
              {formatTierColumnHeader("pro")}
              <span className="sr-only">{PLAN_BY_TIER.pro.name}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-[var(--pf-border)] last:border-0">
              <td
                className={cn(
                  "text-[var(--pf-gray-700)]",
                  compact ? "px-3 py-2" : "px-4 py-3"
                )}
              >
                {row.feature}
              </td>
              <td
                className={cn(
                  "text-center",
                  compact ? "px-3 py-2" : "px-4 py-3",
                  highlightTier === "member" && "bg-[var(--pf-red-muted)]/30"
                )}
              >
                <Cell value={row.member} />
              </td>
              <td
                className={cn(
                  "text-center",
                  compact ? "px-3 py-2" : "px-4 py-3",
                  highlightTier === "pro" && "bg-[var(--pf-red-muted)]/30"
                )}
              >
                <Cell value={row.pro} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
