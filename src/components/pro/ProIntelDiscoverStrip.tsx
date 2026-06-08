import Link from "next/link";
import { BarChart3, Calendar, GitCompare, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTierPrice } from "@/lib/marketing/plans";
import { buildComparePreviewLabel, buildProMembershipHook } from "@/lib/pro/upgrade-prompt";

import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import { buildCompareHref } from "@/lib/dashboard/compare-symbols";

/** Member feed: surface Pro research tools without another full-width banner. */
export function ProIntelDiscoverStrip({
  symbol,
  assetClass = "equity",
  watchlistSymbols = [],
}: {
  symbol?: string;
  assetClass?: "equity" | "crypto";
  watchlistSymbols?: string[];
}) {
  const compareSymbols = symbol
    ? [symbol, ...watchlistSymbols.filter((s) => s.toUpperCase() !== symbol.toUpperCase())].slice(
        0,
        3
      )
    : watchlistSymbols.slice(0, 3);
  const comparePreview = buildComparePreviewLabel(compareSymbols);
  const personalizedHook = buildProMembershipHook(watchlistSymbols);
  const compareHref =
    compareSymbols.length >= 2 ? buildCompareHref(compareSymbols) : buildResearchHubHref("compare");
  const intelHref = symbol
    ? `/ticker/${symbol}`
    : assetClass === "crypto"
      ? "/ticker/BTC"
      : "/ticker/NVDA";
  const intelLabel = assetClass === "crypto" ? "Crypto intel" : "Ticker intel";
  const links = [
    { href: buildResearchHubHref("screener"), label: "Screener", icon: ScanSearch },
    { href: buildResearchHubHref("earnings"), label: "Earnings", icon: Calendar },
    { href: compareHref, label: "Compare", icon: GitCompare },
    { href: intelHref, label: intelLabel, icon: BarChart3 },
  ] as const;

  return (
    <section className="pf-pro-discover-strip">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red-muted)] text-[var(--pf-red)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--pf-black)]">Pro Intelligence research layer</p>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              {personalizedHook ??
                (assetClass === "crypto"
                  ? `Crypto headlines, price action & community conviction — ${formatTierPrice("pro")}/mo.`
                  : `News, filings, intraday charts, screener & compare — ${formatTierPrice("pro")}/mo.`)}
            </p>
            {comparePreview ? (
              <p className="mt-1 text-[11px] font-semibold text-[var(--pf-red)]">
                Ready to compare {comparePreview}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="pf-chip-action gap-1.5 px-3 py-1.5 text-xs"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          <Link href="/settings">
            <Button size="sm">Upgrade</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
