import type { CallWithUser } from "@/lib/db/supabase";
import type { PriceLine } from "@/lib/charts/types";
import { PF_CHART } from "@/lib/charts/theme";

const YOUR_ENTRY = "#475569";
const YOUR_TARGET = PF_CHART.marker.long;
const YOUR_STOP = PF_CHART.candle.down;
const DESK = "#E31B23";
const COMMUNITY_ENTRY = "#7c3aed";
const COMMUNITY_TARGET = "#a78bfa";
const COMMUNITY_STOP = "#c4b5fd";

type LevelPrefix = "Desk" | "Your" | "Community";

function levelColors(prefix: LevelPrefix): { entry: string; target: string; stop: string } {
  if (prefix === "Desk") {
    return { entry: DESK, target: DESK, stop: DESK };
  }
  if (prefix === "Community") {
    return { entry: COMMUNITY_ENTRY, target: COMMUNITY_TARGET, stop: COMMUNITY_STOP };
  }
  return { entry: YOUR_ENTRY, target: YOUR_TARGET, stop: YOUR_STOP };
}

function pushCallLevels(
  lines: PriceLine[],
  call: CallWithUser,
  prefix: LevelPrefix
): void {
  const colors = levelColors(prefix);
  const entry = call.entry_price != null ? Number(call.entry_price) : null;
  const target = call.target_price != null ? Number(call.target_price) : null;
  const stop = call.stop_price != null ? Number(call.stop_price) : null;

  if (entry != null && entry > 0) {
    lines.push({
      price: entry,
      label: `${prefix} entry`,
      color: colors.entry,
      style: "solid",
    });
  }
  if (target != null && target > 0) {
    lines.push({
      price: target,
      label: `${prefix} target`,
      color: colors.target,
      style: "dashed",
    });
  }
  if (stop != null && stop > 0) {
    lines.push({
      price: stop,
      label: `${prefix} stop`,
      color: colors.stop,
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
export function buildFeaturedCallPriceLines(
  call: {
    entry_price: number | null;
    target_price: number | null;
    stop_price?: number | null;
  },
  prefix: "Desk" | "Member" = "Desk"
): PriceLine[] {
  const lines: PriceLine[] = [];
  const levelPrefix: LevelPrefix = prefix === "Member" ? "Your" : "Desk";
  pushCallLevels(lines, call as CallWithUser, levelPrefix);
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

/**
 * Desk + your levels + newest community call for Pro compare overlays.
 */
export function buildCompareCallPriceLines(opts: {
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

  const community = newestCall(
    opts.calls.filter(
      (c) => !c.is_fueled && c.user_id !== opts.viewerUserId && c.id !== desk?.id
    )
  );
  if (community && community.id !== own?.id) {
    pushCallLevels(lines, community, "Community");
  }

  return lines;
}

const PLAN_ENTRY = "#6366f1";
const PLAN_TARGET = "#059669";
const PLAN_STOP = "#dc2626";

/** Private journal entry / stop / target on the watchlist journal chart. */
export function buildJournalPriceLines(journal: {
  entry_price?: number | null;
  stop_price?: number | null;
  target_price?: number | null;
}): PriceLine[] {
  const lines: PriceLine[] = [];

  if (journal.entry_price != null && journal.entry_price > 0) {
    lines.push({
      price: journal.entry_price,
      label: "Plan entry",
      color: PLAN_ENTRY,
      style: "solid",
    });
  }
  if (journal.target_price != null && journal.target_price > 0) {
    lines.push({
      price: journal.target_price,
      label: "Plan target",
      color: PLAN_TARGET,
      style: "dashed",
    });
  }
  if (journal.stop_price != null && journal.stop_price > 0) {
    lines.push({
      price: journal.stop_price,
      label: "Plan stop",
      color: PLAN_STOP,
      style: "dashed",
    });
  }

  return lines;
}

const SCENARIO_BULL = "#d97706";
const SCENARIO_BASE = "#64748b";
const SCENARIO_BEAR = "#be123c";

export function buildJournalScenarioPriceLines(journal: {
  bull_case_price?: number | null;
  base_case_price?: number | null;
  bear_case_price?: number | null;
}): PriceLine[] {
  const lines: PriceLine[] = [];
  if (journal.bull_case_price != null && journal.bull_case_price > 0) {
    lines.push({
      price: journal.bull_case_price,
      label: "Bull case",
      color: SCENARIO_BULL,
      style: "dashed",
    });
  }
  if (journal.base_case_price != null && journal.base_case_price > 0) {
    lines.push({
      price: journal.base_case_price,
      label: "Base case",
      color: SCENARIO_BASE,
      style: "dashed",
    });
  }
  if (journal.bear_case_price != null && journal.bear_case_price > 0) {
    lines.push({
      price: journal.bear_case_price,
      label: "Bear case",
      color: SCENARIO_BEAR,
      style: "dashed",
    });
  }
  return lines;
}
