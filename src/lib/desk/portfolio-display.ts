import type { CallCardData } from "@/components/calls/CallCard";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import type { DeskPortfolioView } from "@/lib/desk/portfolio";

/** Map a live Fueled call row to the desk portfolio panel shape. */
export function fueledCallToPortfolioView(call: CallCardData): DeskPortfolioView {
  const open = isOpenMemberCall(call);
  return {
    id: `fueled-call-${call.id}`,
    asset_class: call.asset_class ?? "equity",
    symbol: call.symbol.toUpperCase(),
    direction: call.direction,
    conviction: 3,
    horizon_tag: call.timeframe_tag ?? null,
    thesis: call.thesis,
    entry_price: call.entry_price ?? call.price_at_call ?? null,
    target_price: call.target_price ?? null,
    stop_price: call.stop_price ?? null,
    status: open ? "open" : "closed",
    opened_at: call.called_at,
    closed_at: call.closed_at ?? null,
    updated_at: call.updated_at ?? call.called_at,
    last_price: call.last_price ?? null,
    return_pct: call.return_pct != null ? Number(call.return_pct) : null,
  };
}

/**
 * Member-facing desk book: admin `desk_portfolio` rows when present,
 * otherwise open Fueled calls (the published house book).
 */
export function mergeDeskPortfolioDisplay(
  adminEntries: DeskPortfolioView[],
  fueledCalls: CallCardData[]
): DeskPortfolioView[] {
  const openAdmin = adminEntries.filter((e) => e.status === "open");
  const closedAdmin = adminEntries.filter((e) => e.status === "closed");

  if (openAdmin.length > 0) {
    return [...openAdmin, ...closedAdmin];
  }

  const openFromCalls = fueledCalls
    .filter((c) => c.is_fueled && isOpenMemberCall(c))
    .filter((c, i, arr) => {
      const sym = c.symbol.toUpperCase();
      return arr.findIndex((x) => x.symbol.toUpperCase() === sym) === i;
    })
    .map(fueledCallToPortfolioView);

  return [...openFromCalls, ...closedAdmin];
}

export function countOpenDeskPortfolio(entries: DeskPortfolioView[]): number {
  return entries.filter((e) => e.status === "open").length;
}
