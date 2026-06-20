import Link from "next/link";
import { Lock } from "lucide-react";
import type { WatchlistEntry } from "@/lib/watchlist/types";

function formatEarningsDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function earningsHourLabel(hour: string | null | undefined): string {
  const h = hour?.toLowerCase() ?? "";
  if (h === "bmo") return "before open";
  if (h === "amc") return "after close";
  if (h.includes("before")) return "before open";
  if (h.includes("after")) return "after close";
  return "";
}

export function WatchlistIntelSnippet({
  item,
  proUnlocked,
}: {
  item: WatchlistEntry;
  proUnlocked: boolean;
}) {
  if (item.asset_class !== "equity") return null;

  if (!proUnlocked) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-[var(--pf-gray-500)]">
        <Lock className="h-2.5 w-2.5 shrink-0 text-[var(--pf-gray-400)]" aria-hidden />
        <span>Pro: earnings date &amp; headlines</span>
        <Link
          href="/dashboard/settings?section=billing"
          className="font-semibold text-[var(--pf-red)] hover:underline"
        >
          Upgrade
        </Link>
      </p>
    );
  }

  const snippet = item.intel_snippet;
  if (!snippet) return null;

  const parts: string[] = [];

  if (snippet.next_earnings_date) {
    const hour = earningsHourLabel(snippet.next_earnings_hour);
    parts.push(
      `Earnings ${formatEarningsDate(snippet.next_earnings_date)}${hour ? ` ${hour}` : ""}`
    );
  }

  const headlines = snippet.news_headline_count_7d;
  if (headlines > 0) {
    parts.push(`${headlines} headline${headlines === 1 ? "" : "s"} (7d)`);
  }

  if (parts.length === 0) {
    return (
      <p className="mt-1 text-[10px] text-[var(--pf-gray-400)]">
        No earnings in 14d · quiet headline week
      </p>
    );
  }

  return (
    <p className="mt-1 text-[10px] font-medium text-[var(--pf-gray-600)]">{parts.join(" · ")}</p>
  );
}
