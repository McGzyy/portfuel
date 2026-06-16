import { DISCORD_COLORS, type DiscordEmbedPayload } from "@/lib/discord/embed-payloads";
import { getDiscordConfig } from "@/lib/discord/config";
import { enqueueDiscordOutbox } from "@/lib/discord/outbox";
import { enqueueDiscordDm, discordUrlNoPreview } from "@/lib/discord/dm";
import { createServiceClient } from "@/lib/db/supabase";
import { adminSupportPanelUrl, memberTicketUrl } from "@/lib/support/tickets";
import type { SupportCategory, SupportTicketRow, SupportTicketWithUser } from "@/lib/support/types";
import {
  formatTicketRef,
  supportCategoryLabel,
  supportStatusLabel,
} from "@/lib/support/types";
import { getAppUrl } from "@/lib/stripe/config";
import { buildSupportTicketEmbed } from "@/lib/discord/admin-events";

function previewText(text: string, max = 280): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function ticketChannelName(ticket: SupportTicketWithUser): string {
  const ref = formatTicketRef(ticket.ticket_number).toLowerCase();
  const who =
    ticket.username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 24) || "member";
  return `${ref}-${who}`.slice(0, 100);
}

async function linkedDiscordUserId(userId: string): Promise<string | null> {
  const cfg = getDiscordConfig();
  const db = createServiceClient();
  const { data } = await db
    .from("discord_accounts")
    .select("discord_user_id")
    .eq("user_id", userId)
    .eq("guild_id", cfg.guildId)
    .maybeSingle();
  return data?.discord_user_id ? String(data.discord_user_id) : null;
}

export async function notifyDiscordSupportTicketCreated(
  ticket: SupportTicketWithUser,
  preview: string
): Promise<void> {
  const { guildId } = getDiscordConfig();
  if (!guildId) return;

  const memberLabel = ticket.display_name?.trim() || ticket.username;
  const embed = buildSupportTicketEmbed({ ticket, preview, kind: "new" });
  const discordUserId = await linkedDiscordUserId(ticket.user_id);
  if (!discordUserId) return;

  const { categorySupport } = getDiscordConfig().channels;

  await enqueueDiscordOutbox({
    channelId: "support",
    eventType: "support.ticket.create_channel",
    dedupeKey: `support:channel:${ticket.id}`,
    payload: {
      ticketId: ticket.id,
      channelName: ticketChannelName(ticket),
      guildId,
      categoryId: categorySupport || undefined,
      memberDiscordUserId: discordUserId,
      embed,
      initialMessage: `**Member** · ${memberLabel}\n${previewText(preview, 1800)}`,
    },
  });

  const ref = formatTicketRef(ticket.ticket_number);
  const url = `${getAppUrl()}${memberTicketUrl(ticket.id)}`;
  await enqueueDiscordDm(
    discordUserId,
    `**Support ticket opened** — **${ref}**\n` +
      `*${ticket.subject}*\n\n` +
      `${previewText(preview, 400)}\n\n` +
      `Your private support channel is ready in Discord.\n` +
      `Track replies: ${discordUrlNoPreview(url)}`,
    { suppressEmbeds: true }
  );
}

export async function notifyDiscordSupportTicketChannelMessage(input: {
  ticketId: string;
  ticketNumber: number;
  authorLabel: string;
  authorRole: "member" | "admin" | "system";
  body: string;
  status?: string;
}): Promise<void> {
  const db = createServiceClient();
  const { data: row } = await db
    .from("support_tickets")
    .select("discord_channel_id")
    .eq("id", input.ticketId)
    .maybeSingle();
  const channelId = row?.discord_channel_id ? String(row.discord_channel_id) : null;
  if (!channelId) return;

  const ref = formatTicketRef(input.ticketNumber);
  const roleTag =
    input.authorRole === "admin"
      ? "**Staff**"
      : input.authorRole === "member"
        ? "**Member**"
        : "**System**";

  await enqueueDiscordOutbox({
    channelId: "support",
    eventType: "support.ticket.channel_message",
    payload: {
      ticketId: input.ticketId,
      channelId,
      content:
        `${roleTag} · ${input.authorLabel}\n` +
        `${previewText(input.body, 1800)}` +
        (input.status ? `\n\n_Status: ${input.status}_` : ""),
      embed:
        input.authorRole === "system"
          ? ({
              title: `${ref} · Status update`,
              description: input.body,
              color: DISCORD_COLORS.digest,
              footer: { text: "PortFuel · Support" },
            } satisfies DiscordEmbedPayload)
          : undefined,
    },
  });
}

/** @deprecated Use notifyDiscordSupportTicketChannelMessage */
export const notifyDiscordSupportTicketThreadMessage = notifyDiscordSupportTicketChannelMessage;

export async function saveSupportTicketDiscordChannel(input: {
  ticketId: string;
  guildId: string;
  channelId: string;
  rootMessageId: string;
}): Promise<void> {
  const db = createServiceClient();
  await db
    .from("support_tickets")
    .update({
      discord_guild_id: input.guildId,
      discord_channel_id: input.channelId,
      discord_root_message_id: input.rootMessageId,
    } as never)
    .eq("id", input.ticketId);
}

/** @deprecated Use saveSupportTicketDiscordChannel */
export const saveSupportTicketDiscordThread = saveSupportTicketDiscordChannel;

export async function getSupportTicketByDiscordChannel(
  channelId: string
): Promise<SupportTicketWithUser | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("support_tickets")
    .select("*")
    .eq("discord_channel_id", channelId)
    .maybeSingle();
  if (!data) return null;

  const { data: user } = await db
    .from("users")
    .select("username, display_name, email")
    .eq("id", (data as { user_id: string }).user_id)
    .maybeSingle();

  return {
    ...(data as SupportTicketWithUser),
    username: user?.username ?? "unknown",
    display_name: user?.display_name ?? null,
    email: user?.email ?? null,
  };
}

/** @deprecated Use getSupportTicketByDiscordChannel */
export const getSupportTicketByDiscordThread = getSupportTicketByDiscordChannel;

export async function resolveDiscordTicketAuthor(input: {
  discordUserId: string;
  ticketUserId: string;
  discordStaff?: boolean;
}): Promise<
  | { ok: true; userId: string; role: "admin" | "member"; label: string }
  | { ok: false; reason: string }
> {
  const cfg = getDiscordConfig();
  const db = createServiceClient();
  const { data: link } = await db
    .from("discord_accounts")
    .select("user_id, users!inner(username, display_name, role)")
    .eq("discord_user_id", input.discordUserId)
    .eq("guild_id", cfg.guildId)
    .maybeSingle();

  if (!link) {
    return { ok: false, reason: "Link your PortFuel account in #verification to reply on tickets." };
  }

  const usersRaw = (link as { users: unknown }).users;
  const user = (Array.isArray(usersRaw) ? usersRaw[0] : usersRaw) as {
    username: string;
    display_name: string | null;
    role: string;
  };

  const userId = String((link as { user_id: string }).user_id);
  const label = user.display_name?.trim() || user.username;

  if (user.role === "admin" || input.discordStaff) {
    return { ok: true, userId, role: "admin", label };
  }

  if (userId === input.ticketUserId) {
    return { ok: true, userId, role: "member", label };
  }

  return { ok: false, reason: "You can only reply on your own support tickets." };
}

export function discordTicketChannelUrl(
  ticket: Pick<SupportTicketRow, "discord_guild_id" | "discord_channel_id">
): string | null {
  if (!ticket.discord_channel_id || !ticket.discord_guild_id) return null;
  return `https://discord.com/channels/${ticket.discord_guild_id}/${ticket.discord_channel_id}`;
}

/** @deprecated Use discordTicketChannelUrl */
export const discordTicketThreadUrl = discordTicketChannelUrl;

export async function notifyDiscordSupportTicketAttachmentUploaded(input: {
  ticketId: string;
  messageId: string;
  attachmentId: string;
  fileName: string;
  contentType: string;
}): Promise<void> {
  const db = createServiceClient();
  const { data: row } = await db
    .from("support_tickets")
    .select("discord_channel_id")
    .eq("id", input.ticketId)
    .maybeSingle();
  const channelId = row?.discord_channel_id ? String(row.discord_channel_id) : null;
  if (!channelId) return;

  const { createSupportAttachmentBotDownload } = await import("@/lib/support/attachments");
  const file = await createSupportAttachmentBotDownload(input.attachmentId);
  if (!file?.signedUrl) return;

  await enqueueDiscordOutbox({
    channelId: "support",
    eventType: "support.ticket.channel_attachment",
    payload: {
      ticketId: input.ticketId,
      channelId,
      fileName: input.fileName,
      contentType: input.contentType,
      signedUrl: file.signedUrl,
    },
  });
}

export async function notifyDiscordSupportTicketStatusChange(
  ticket: SupportTicketWithUser,
  status: SupportTicketWithUser["status"]
): Promise<void> {
  const db = createServiceClient();
  const { data: row } = await db
    .from("support_tickets")
    .select("discord_channel_id, discord_root_message_id")
    .eq("id", ticket.id)
    .maybeSingle();

  const channelId = row?.discord_channel_id ? String(row.discord_channel_id) : null;
  const rootMessageId = row?.discord_root_message_id
    ? String(row.discord_root_message_id)
    : null;

  await notifyDiscordSupportTicketChannelMessage({
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    authorLabel: "PortFuel",
    authorRole: "system",
    body: `Status → **${ticketStatusDiscordLabel(status)}**`,
    status: ticketStatusDiscordLabel(status),
  });

  if (!channelId || !rootMessageId) return;

  const ticketForEmbed = { ...ticket, status };
  const embed = buildSupportTicketEmbed({
    ticket: ticketForEmbed,
    preview: ticketForEmbed.subject,
    kind: "new",
  });

  await enqueueDiscordOutbox({
    channelId: "support",
    eventType: "support.ticket.sync_status",
    payload: {
      ticketId: ticket.id,
      channelId,
      rootMessageId,
      embed,
      deleteChannel: status === "resolved" || status === "closed",
    },
  });
}

export const TICKET_CLOSE_BUTTON_ID = "pf:ticket-close";

export async function notifyDiscordSupportTicketIdleWarningDm(
  ticket: SupportTicketWithUser,
  closesInDays: number
): Promise<void> {
  const discordUserId = await linkedDiscordUserId(ticket.user_id);
  if (!discordUserId) return;

  const ref = formatTicketRef(ticket.ticket_number);
  const url = `${getAppUrl()}${memberTicketUrl(ticket.id)}`;
  const dayLabel = closesInDays === 1 ? "day" : "days";

  await enqueueDiscordDm(
    discordUserId,
    `**${ref}** is waiting on your reply.\n\n` +
      `*${ticket.subject}*\n\n` +
      `Reply in Discord or on portfuel.pro within **${closesInDays} ${dayLabel}** or the ticket will close automatically.\n\n` +
      `View: ${discordUrlNoPreview(url)}`,
    { suppressEmbeds: true }
  );
}

export function buildMemberSupportHubEmbeds(appUrl: string): DiscordEmbedPayload[] {
  const admin = `${appUrl.replace(/\/$/, "")}/admin?tab=support`;
  return [
    {
      title: "PortFuel — Staff support desk",
      url: admin,
      description:
        "> **Staff & moderators only** — ticket playbook and queue overview.\n\n" +
        "• Members open tickets in **#open-ticket** (private channel per ticket)\n" +
        "• Reply in the member's ticket channel or on **portfuel.pro** admin support\n" +
        "• Closed tickets delete their Discord channel automatically\n\n" +
        `**Admin panel:** ${admin}`,
      color: DISCORD_COLORS.brand,
      footer: { text: "PortFuel · Mod lounge" },
    },
  ];
}

export const MEMBER_SUPPORT_HUB_MARKER = "PortFuel — Staff support desk";
export const MEMBER_SUPPORT_HUB_CONTENT =
  "📌 **Staff support desk** — tickets live in private channels under PortFuel Support. _Auto-updated by PortFuel._";

export const MEMBER_SUPPORT_HUB_LEGACY_MARKERS = ["PortFuel — Official support"];

export function ticketStatusDiscordLabel(status: string): string {
  return supportStatusLabel(status as SupportTicketWithUser["status"]);
}

export function ticketCategoryDiscordLabel(category: string): string {
  return supportCategoryLabel(category as SupportCategory);
}

export { adminSupportPanelUrl, formatTicketRef };
