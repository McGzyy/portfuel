import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import { appIconUrl, hubBullets } from "@/lib/discord/hub-embed-helpers";

export const VERIFICATION_MARKER_TITLE = "Welcome to PortFuel";

export const VERIFICATION_LEGACY_MARKER_TITLES: string[] = [];

export function buildVerificationEmbed(appUrl: string): DiscordEmbedPayload {
  const base = appUrl.replace(/\/$/, "");

  return {
    author: { name: "PortFuel Intelligence", url: base },
    title: VERIFICATION_MARKER_TITLE,
    url: `${base}/join`,
    description:
      "> **Verify** to enter the server · **Link** your subscription for member channels.\n\n" +
      hubBullets([
        "**Step 1 — Verify** below → Member hub, rules, announcements, general & fueled feeds",
        "**Step 2 — Link PortFuel** (logged in on portfuel.pro) → **#member-calls** + lounges in ~60s",
        "**Help AI** — DM this bot · 5 preview Qs · **40/mo** for linked Pro",
      ]) +
      "\n\n_Subscribers only for Step 2 — billing lives on portfuel.pro._",
    color: DISCORD_COLORS.brand,
    thumbnail: { url: appIconUrl(base) },
    footer: { text: "PortFuel · Verification" },
  };
}
