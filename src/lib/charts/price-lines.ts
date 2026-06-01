import type { CallWithUser } from "@/lib/db/supabase";
import type { PriceLine } from "@/lib/charts/types";
import { PF_CHART } from "@/lib/charts/theme";

const YOUR_ENTRY = "#475569";
const YOUR_TARGET = PF_CHART.marker.long;
const YOUR_STOP = PF_CHART.candle.down;
const DESK = "#E31B23";

function pushCallLevels(
  lines: PriceLine[],
  call: CallWithUser,
  prefix: string
): void {
  const entry = call.entry_price != null ? Number(call.entry_price) : null;
  const target = call.target_price != null ? Number(call.target_price) : null;
  const stop = call.stop_price != null ? Number(call.stop_price) : null;

  if (entry != null && entry > 0) {
    lines.push({
      price: entry,
      label: `${prefix} entry`,
      color: prefix === "Desk" ? DESK : YOUR_ENTRY,
      style: "solid",
    });
  }
  if (target != null && target > 0) {
    lines.push({
      price: target,
      label: `${prefix} target`,
      color: prefix === "Desk" ? DESK : YOUR_TARGET,
      style: "dashed",
    });
  }
  if (stop != null && stop > 0) {
    lines.push({
      price: stop,
      label: `${prefix} stop`,
      color: prefix === "Desk" ? DESK : YOUR_STOP,
      style: "dashed",
    });
  }
}

function newestCall(calls: CallWithUser[]): CallWithUser | undefined {
  if (calls.length === 0) return undefined;
  return [...calls].sort(
    (a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
  )[0];
}

/**
 * Entry / target for a single featured call (social milestone charts).
 */
export function buildFeaturedCallPriceLines(call: {
  entry_price: number | null;
  target_price: number | null;
  stop_price?: number | null;
}): PriceLine[] {
  const lines: PriceLine[] = [];
  pushCallLevels(lines, call as CallWithUser, "Desk");
  return lines;
}

/**
 * Horizontal entry / target / stop levels for the ticker chart (Phase G1).
 */
export function buildTickerPriceLines(opts: {
  calls: CallWithUser[];
  viewerUserId?: string | null;
}): PriceLine[] {
  const lines: PriceLine[] = [];

  const own =
    opts.viewerUserId != null
      ? newestCall(opts.calls.filter((c) => c.user_id === opts.viewerUserId))
      : undefined;

  if (own) {
    pushCallLevels(lines, own, "Your");
  }

  const desk = newestCall(opts.calls.filter((c) => c.is_fueled));
  if (desk && desk.id !== own?.id) {
    pushCallLevels(lines, desk, "Desk");
  }

  return lines;
}
