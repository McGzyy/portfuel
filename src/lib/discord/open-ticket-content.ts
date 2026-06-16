import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";

export const OPEN_TICKET_HUB_MARKER = "PortFuel — Open a support ticket";
export const OPEN_TICKET_CATEGORY_SELECT_ID = "pf:ticket-pick-category";

export const OPEN_TICKET_HUB_CONTENT =
  "📩 **Need help?** Pick a category below, then describe your issue in the form that opens.";

export function buildOpenTicketHubEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const help = `${appUrl.replace(/\/$/, "")}/dashboard/help?view=tickets`;
  return [
    {
      title: OPEN_TICKET_HUB_MARKER,
      url: help,
      description:
        "> **Official PortFuel support** — one private channel per ticket.\n\n" +
        "1. Choose a **category** below\n" +
        "2. Fill in **subject** and **details** in the popup\n" +
        "3. Staff reply in your private channel and on **portfuel.pro**\n\n" +
        "_Requires a linked PortFuel account and active membership._",
      color: DISCORD_COLORS.brand,
      footer: { text: "PortFuel · Help & Support" },
    },
  ];
}
