/** Shared formatting for pinned Discord hub embeds (official-links, rules, faqs). */

import { resolveSymbolLogoUrl } from "@/lib/market/symbol-logo";

export function appIconUrl(appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}/icon`;
}

/** Ticker logo for call embeds when available; otherwise PortFuel app icon. */
export async function resolveCallEmbedThumbnail(
  symbol: string,
  appUrl: string
): Promise<string> {
  const logo = await resolveSymbolLogoUrl(symbol);
  return logo ?? appIconUrl(appUrl);
}

/** Short bullets — scannable on mobile. */
export function hubBullets(lines: string[]): string {
  return lines.map((line) => `▸ ${line}`).join("\n");
}

/** Channel field for inline grids: channel name + one-line purpose. */
export function hubChannel(name: string, purpose: string): string {
  return `**${name}**\n${purpose}`;
}

/** FAQ field — question as name, answer as value. */
export function hubFaq(question: string, answer: string): { name: string; value: string; inline: false } {
  const q = question.endsWith("?") ? question : `${question}?`;
  return { name: `❓ ${q}`, value: answer, inline: false };
}

/** Tier line for membership embeds. */
export function hubTierLine(name: string, price: string, period: string, highlight: string): string {
  return `**${name}** · ${price}${period}\n${highlight}`;
}

export const HUB_DISCLAIMER = "_Educational content only — not investment advice._";
export const HUB_RISK_DISCLAIMER =
  "_Nothing here is investment advice. Trading involves substantial risk of loss._";
