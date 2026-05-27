import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTierPrice } from "@/lib/marketing/plans";

/** Slim overview upsell — full list stays on profile / join. */
export function ProUpgradeBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--pf-radius-lg)] border border-[var(--pf-red)]/20 bg-gradient-to-r from-[var(--pf-red-muted)] to-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--pf-black)]">Unlock Pro Intelligence</p>
          <p className="text-xs text-[var(--pf-gray-600)]">
            Ticker intel, screener, compare, intraday charts, 6 calls/week — {formatTierPrice("pro")}.
          </p>
        </div>
      </div>
      <Link href="/profile" className="shrink-0">
        <Button size="sm">Upgrade</Button>
      </Link>
    </div>
  );
}
