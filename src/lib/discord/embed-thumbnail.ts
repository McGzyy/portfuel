import { appIconUrl } from "@/lib/discord/hub-embed-helpers";
import { resolveSymbolLogoUrl } from "@/lib/market/symbol-logo";

/** Ticker logo for call embeds when available; otherwise PortFuel app icon. */
export async function resolveCallEmbedThumbnail(
  symbol: string,
  appUrl: string
): Promise<string> {
  const logo = await resolveSymbolLogoUrl(symbol);
  return logo ?? appIconUrl(appUrl);
}
