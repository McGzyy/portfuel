/** Shared formatting for call alert embeds (member, fueled, milestones, targets). */

import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { HUB_DISCLAIMER } from "@/lib/discord/hub-embed-helpers";

export function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatReturnPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function callDirectionLabel(direction: "long" | "short"): string {
  return direction === "long" ? "LONG" : "SHORT";
}

export function callThesisQuote(thesis: string | null | undefined, max = 300): string {
  const t = thesis?.trim();
  if (!t) return "> _Read the full thesis on PortFuel._";
  const preview = t.length <= max ? t : `${t.slice(0, max - 1)}…`;
  return `> ${preview.replace(/\n/g, "\n> ")}`;
}

export function callLevelsLine(input: {
  entryPrice?: number | null;
  targetPrice?: number | null;
  stopPrice?: number | null;
}): string {
  return (
    `**Entry** ${formatUsd(input.entryPrice)} · ` +
    `**Target** ${formatUsd(input.targetPrice)} · ` +
    `**Stop** ${formatUsd(input.stopPrice)}`
  );
}

export function profileUrl(appUrl: string, username: string): string {
  return `${appUrl.replace(/\/$/, "")}/member/${encodeURIComponent(username)}`;
}

export function tickerUrl(appUrl: string, symbol: string): string {
  return `${appUrl.replace(/\/$/, "")}/ticker/${encodeURIComponent(symbol)}`;
}

export function milestoneDisplayLabel(key: CallMilestoneKey): string {
  switch (key) {
    case "target_reached":
      return "Target hit";
    case "return_10":
      return "+10% milestone";
    case "return_25":
      return "+25% milestone";
    case "return_50":
      return "+50% milestone";
  }
}

export function milestonePostContent(key: CallMilestoneKey, symbol: string): string {
  switch (key) {
    case "target_reached":
      return `🎯 **Target reached** · **${symbol}**`;
    case "return_50":
      return `📈 **+50% milestone** · **${symbol}**`;
    case "return_25":
      return `📈 **+25% milestone** · **${symbol}**`;
    case "return_10":
      return `📈 **+10% milestone** · **${symbol}**`;
  }
}

export const CALL_POST_DISCLAIMER = HUB_DISCLAIMER;
