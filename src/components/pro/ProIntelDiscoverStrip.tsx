import Link from "next/link";
import { BarChart3, Calendar, GitCompare, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTierPrice } from "@/lib/marketing/plans";

const LINKS = [
  { href: "/dashboard/screener", label: "Screener", icon: ScanSearch },
  { href: "/dashboard/earnings", label: "Earnings", icon: Calendar },
  { href: "/dashboard/compare", label: "Compare", icon: GitCompare },
  { href: "/ticker/NVDA", label: "Ticker intel", icon: BarChart3 },
] as const;

/** Member feed: surface Pro research tools without another full-width banner. */
export function ProIntelDiscoverStrip({ symbol }: { symbol?: string }) {
  const intelHref = symbol ? `/ticker/${symbol}` : "/ticker/NVDA";
  return (
    <section className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-4 py-3 shadow-[var(--pf-shadow-sm)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--pf-black)]">Pro Intelligence research layer</p>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              News, filings, intraday charts, screener &amp; compare — {formatTierPrice("pro")}/mo.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={label === "Ticker intel" ? intelHref : href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-300)] hover:bg-white"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          <Link href="/profile">
            <Button size="sm">Upgrade</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
