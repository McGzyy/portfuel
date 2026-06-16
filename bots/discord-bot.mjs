import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  ModalBuilder,
  Partials,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import dotenv from "dotenv";
import fs from "node:fs";

try {
  const envPath = new URL("../.env.local", import.meta.url);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch {
  // ignore
}

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const DISCORD_TOKEN = reqEnv("DISCORD_TOKEN");
const GUILD_ID = reqEnv("DISCORD_GUILD_ID");
const APP_URL = (process.env.PORTFUEL_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const BOT_API_KEY = reqEnv("BOT_API_KEY");
const WORKER_ID = process.env.DISCORD_BOT_WORKER_ID ?? "discord-bot";

const ROLE_UNVERIFIED = process.env.DISCORD_ROLE_UNVERIFIED_ID ?? "1510855393184714893";
const ROLE_VERIFIED = process.env.DISCORD_ROLE_VERIFIED_ID ?? "1510805030666506311";
const ROLE_MEMBER = process.env.DISCORD_ROLE_MEMBER_ID ?? "1510805558569992272";
const ROLE_PRO = process.env.DISCORD_ROLE_PRO_ID ?? "1510805852154757190";

const VERIFICATION_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_VERIFICATION_ID ?? "1510828920487022652";
const OFFICIAL_LINKS_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_OFFICIAL_LINKS_ID?.trim() || "1510828840161771631";
const RULES_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_RULES_ID?.trim() || "1516273847190683820";
const FAQS_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_FAQS_ID?.trim() || "1510807143253803079";
const PRO_FORUMS_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_PRO_FORUMS_ID?.trim() ||
  process.env.DISCORD_CHANNEL_PRO_MEMBER_FORUMS?.trim() ||
  "1510800077889867787";
const CALLS_CHANNEL_ID = process.env.DISCORD_CHANNEL_CALLS_ID ?? "1510841810430197991";
const TARGETS_CHANNEL_ID = process.env.DISCORD_CHANNEL_TARGETS_ID ?? "1510842222143340707";
const MEMBER_CHAT_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_MEMBER_CHAT_ID ?? "1510799917415923763";
const PRO_MEMBER_CHAT_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_PRO_MEMBER_CHAT_ID ?? "1510799989213757460";

const BOT_LOG_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_BOT_LOG_ID?.trim() ||
  process.env.DISCORD_CHANNEL_BOT_LOG?.trim() ||
  "1516298968626364477";
const MEMBER_SUPPORT_CHANNEL_ID =
  process.env.DISCORD_CHANNEL_MEMBER_SUPPORT_ID?.trim() || "1516293166007849200";
const OPEN_TICKET_CHANNEL_ID = process.env.DISCORD_CHANNEL_OPEN_TICKET_ID?.trim() || "";
const SUPPORT_CATEGORY_ID = process.env.DISCORD_CATEGORY_SUPPORT_ID?.trim() || "";
const ROLE_ADMIN = process.env.DISCORD_ROLE_ADMIN_ID?.trim() || "1510805262280298576";
const ROLE_MODERATOR = process.env.DISCORD_ROLE_MODERATOR_ID?.trim() || "1510805348120793138";

const VERIFY_BUTTON_ID = "pf:verify";
const LINK_BUTTON_ID = "pf:link";
const TICKET_CATEGORY_SELECT_ID = "pf:ticket-pick-category";
const TICKET_OPEN_MODAL_PREFIX = "pf:ticket-open:";

const verifyCooldownMs = 30_000;
const verifyCooldown = new Map();
const helpDmCooldownMs = 8_000;
const helpDmCooldown = new Map();

const HELP_DM_INTRO =
  "I'm **PortFuel Help** — ask about **features, plans, and pricing** even before you join.\n\n" +
  "**Everyone** gets **5 preview questions** in this DM (features & pricing only).\n\n" +
  "**Pro Intelligence** members with a linked account get **40 questions/month** with full account and workspace answers.\n\n" +
  `Link in <#${VERIFICATION_CHANNEL_ID}> → **Link PortFuel** after joining, or start at portfuel.pro/join.\n\n` +
  "_Product questions only — not investment advice._";

/** 0 = disabled. Default 1 day. */
const MIN_ACCOUNT_AGE_DAYS = Number(process.env.DISCORD_MIN_ACCOUNT_AGE_DAYS ?? "1");

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${APP_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-portfuel-bot-key": BOT_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get("content-type") ?? "";
  const json =
    contentType.includes("application/json")
      ? await res.json().catch(() => null)
      : null;
  if (!res.ok) {
    const err = new Error(
      json?.message ? String(json.message) : json?.error ? String(json.error) : `${res.status}`
    );
    err.apiCode = json?.error ? String(json.error) : `${res.status}`;
    throw err;
  }
  if (!json || typeof json !== "object") {
    throw new Error(
      "PortFuel API returned an unexpected response. The site may still be deploying — try again in a minute."
    );
  }
  return json;
}

function splitDiscordMessage(text, maxLen = 1900) {
  const chunks = [];
  let rest = text.trim();
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf("\n", maxLen);
    if (cut < maxLen * 0.5) cut = maxLen;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function sendDmChunks(channel, text) {
  const parts = splitDiscordMessage(text);
  for (const part of parts) {
    await channel.send({ content: part });
  }
}

function isRoleId(v) {
  return typeof v === "string" && /^\d{16,20}$/.test(v);
}

async function ensureRole(member, roleId, enabled) {
  if (!isRoleId(roleId)) return;
  const has = member.roles.cache.has(roleId);
  if (enabled && !has) await member.roles.add(roleId);
  if (!enabled && has) await member.roles.remove(roleId);
}

async function fetchChartAttachment(callId, milestone, symbol) {
  if (!callId || !milestone) return null;
  const chartUrl = `${APP_URL}/api/social/chart/${callId}?milestone=${encodeURIComponent(milestone)}`;
  const res = await fetch(chartUrl);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const safeSym = String(symbol ?? "chart")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 12);
  return new AttachmentBuilder(buf, { name: `${safeSym || "chart"}-${milestone}.png` });
}

async function postToChannel(client, channelId, payload, chartOpts) {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel)) throw new Error("channel_unavailable");

  const message = await buildOutboxDiscordMessage(payload, chartOpts);
  await channel.send(message);
}

function applyEmbedPayload(builder, embed) {
  if (embed.title) builder.setTitle(embed.title);
  if (embed.url) builder.setURL(embed.url);
  if (embed.description) builder.setDescription(embed.description);
  if (embed.color != null) builder.setColor(embed.color);
  if (embed.footer?.text) builder.setFooter({ text: embed.footer.text });
  if (embed.author?.name) {
    builder.setAuthor({ name: embed.author.name, url: embed.author.url ?? undefined });
  }
  if (embed.thumbnail?.url) {
    builder.setThumbnail(embed.thumbnail.url);
  }
  if (Array.isArray(embed.fields)) {
    for (const field of embed.fields) {
      if (!field?.name || !field?.value) continue;
      builder.addFields({
        name: String(field.name).slice(0, 256),
        value: String(field.value).slice(0, 1024),
        inline: Boolean(field.inline),
      });
    }
  }
  return builder;
}

async function buildOutboxDiscordMessage(payload, chartOpts) {
  const files = [];
  if (chartOpts?.attachChart && chartOpts.callId && chartOpts.milestone) {
    const file = await fetchChartAttachment(
      chartOpts.callId,
      chartOpts.milestone,
      chartOpts.symbol
    );
    if (file) files.push(file);
  }

  if (payload?.embed && typeof payload.embed === "object") {
    const embed = applyEmbedPayload(new EmbedBuilder(), payload.embed);
    return {
      content: typeof payload.content === "string" ? payload.content : undefined,
      embeds: [embed],
      files,
    };
  }

  const content =
    typeof payload?.text === "string" && payload.text.trim() ? payload.text.trim() : null;
  if (!content) throw new Error("empty_outbox_content");
  return { content, files };
}

async function botLog(client, message) {
  if (!isRoleId(BOT_LOG_CHANNEL_ID)) return;
  await postToChannel(client, BOT_LOG_CHANNEL_ID, { text: message }).catch(() => null);
}

async function applyEntitlementsToMember(member, entitlements) {
  const isActive = Boolean(entitlements?.linked && entitlements?.isActive);
  const isPro = Boolean(entitlements?.isPro);
  await ensureRole(member, ROLE_MEMBER, isActive);
  await ensureRole(member, ROLE_PRO, isPro);
}

function formatStatsMessage(stats) {
  if (!stats.linked) {
    return (
      "This Discord account is not linked to PortFuel yet.\n" +
      `Use <#${VERIFICATION_CHANNEL_ID}> → **Link PortFuel** while logged in on portfuel.pro.`
    );
  }
  const name = stats.displayName || stats.username;
  const tier = stats.membershipTier ? String(stats.membershipTier).toUpperCase() : "—";
  const win =
    stats.winRate != null ? `${Number(stats.winRate).toFixed(1)}%` : "—";
  const lines = (stats.recentCalls ?? []).map((c) => {
    const ret =
      c.returnPct != null
        ? ` ${c.returnPct >= 0 ? "+" : ""}${Number(c.returnPct).toFixed(1)}%`
        : "";
    const fueled = c.isFueled ? " 🔥" : "";
    return `• **${c.symbol}** ${String(c.direction).toUpperCase()}${ret}${fueled}`;
  });
  return (
    `**${name}** (@${stats.username})\n` +
    `Tier: ${tier} · Calls: ${stats.callsCount ?? 0} · Win rate: ${win} · Rank: ${stats.rankScore ?? 0}\n` +
    `${stats.profileUrl}\n\n` +
    (lines.length ? `**Recent calls**\n${lines.join("\n")}` : "_No published calls yet._")
  );
}

async function registerSlashCommands(client) {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
    body: [
      new SlashCommandBuilder()
        .setName("sync")
        .setDescription("Re-sync PortFuel Member/Pro roles for a user")
        .addUserOption((o) =>
          o.setName("member").setDescription("Discord member").setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .toJSON(),
      new SlashCommandBuilder()
        .setName("stats")
        .setDescription("PortFuel track record for a linked member")
        .addUserOption((o) =>
          o.setName("member").setDescription("Discord member (defaults to you)")
        )
        .toJSON(),
      new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Official PortFuel support tickets")
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("List your open support tickets")
        )
        .toJSON(),
    ],
  });
  console.log("[discord-bot] registered /sync, /stats, and /ticket commands");
}

function verificationButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(VERIFY_BUTTON_ID)
      .setLabel("Verify")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(LINK_BUTTON_ID)
      .setLabel("Link PortFuel")
      .setStyle(ButtonStyle.Primary)
  );
}

function fallbackVerificationEmbed() {
  return new EmbedBuilder()
    .setTitle("Welcome to PortFuel")
    .setDescription("Click **Verify** below, then **Link PortFuel** if you are a subscriber.")
    .setColor(0xe31b23)
    .setFooter({ text: "PortFuel · Verification" });
}

async function ensureVerificationMessage(client) {
  const channel = await client.channels.fetch(VERIFICATION_CHANNEL_ID).catch(() => null);
  if (!channel || !("messages" in channel)) {
    console.warn("[discord-bot] verification channel not found");
    return;
  }

  const data = await api("/api/discord/verification").catch((e) => {
    console.error("[discord-bot] verification fetch", e);
    return null;
  });
  const rawEmbeds = Array.isArray(data?.embeds) ? data.embeds : [];
  const embed =
    rawEmbeds.length > 0
      ? applyEmbedPayload(new EmbedBuilder(), rawEmbeds[0])
      : fallbackVerificationEmbed();

  const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  const existing = recent?.find(
    (m) =>
      m.author.id === client.user?.id &&
      m.components.some((row) =>
        row.components.some((c) => c.customId === VERIFY_BUTTON_ID)
      )
  );

  const payload = { embeds: [embed], components: [verificationButtons()] };

  if (existing) {
    await existing.edit(payload).catch(() => null);
    console.log("[discord-bot] updated verification message");
    return;
  }

  await channel.send(payload);
  console.log("[discord-bot] posted verification message");
}

async function ensurePinnedHubFromApi(client, channelId, apiPath, label) {
  if (!channelId) {
    console.log(`[discord-bot] ${label}: channel id not configured, skipping`);
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !("messages" in channel)) {
    console.warn(`[discord-bot] ${label}: channel not found`);
    return;
  }

  const data = await api(apiPath).catch((e) => {
    console.error(`[discord-bot] ${label} fetch`, e);
    return null;
  });
  const markerTitle = data?.markerTitle ?? null;
  const legacyMarkerTitles = Array.isArray(data?.legacyMarkerTitles)
    ? data.legacyMarkerTitles.filter((t) => typeof t === "string" && t.trim())
    : [];
  const content =
    typeof data?.content === "string" && data.content.trim() ? data.content.trim() : null;
  const rawEmbeds = Array.isArray(data?.embeds) ? data.embeds : [];
  if (!markerTitle || rawEmbeds.length === 0) {
    console.warn(`[discord-bot] ${label}: no hub payload from API`);
    return;
  }

  const embeds = rawEmbeds.map((e) => applyEmbedPayload(new EmbedBuilder(), e));
  const payload = content ? { content, embeds } : { embeds };

  const recent = await channel.messages.fetch({ limit: 15 }).catch(() => null);
  const existing = recent?.find(
    (m) =>
      m.author.id === client.user?.id &&
      m.embeds.length > 0 &&
      (m.embeds[0]?.title === markerTitle || legacyMarkerTitles.includes(m.embeds[0]?.title))
  );

  if (existing) {
    await existing.edit(payload).catch(() => null);
    console.log(`[discord-bot] updated ${label}`);
    return;
  }

  await channel.send(payload);
  console.log(`[discord-bot] posted ${label}`);
}

async function ensureOfficialLinksMessage(client) {
  await ensurePinnedHubFromApi(
    client,
    OFFICIAL_LINKS_CHANNEL_ID,
    "/api/discord/official-links",
    "official-links hub"
  );
}

async function ensureRulesMessage(client) {
  await ensurePinnedHubFromApi(client, RULES_CHANNEL_ID, "/api/discord/rules", "rules hub");
}

async function ensureFaqsMessage(client) {
  await ensurePinnedHubFromApi(client, FAQS_CHANNEL_ID, "/api/discord/faqs", "faqs hub");
}

async function ensureForumsMessage(client) {
  await ensurePinnedHubFromApi(
    client,
    PRO_FORUMS_CHANNEL_ID,
    "/api/discord/forums",
    "pro forums hub"
  );
}

async function ensureMemberSupportHub(client) {
  await ensurePinnedHubFromApi(
    client,
    MEMBER_SUPPORT_CHANNEL_ID,
    "/api/discord/member-support",
    "member support hub"
  );
}

function openTicketCategoryMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(TICKET_CATEGORY_SELECT_ID)
      .setPlaceholder("Choose a category")
      .addOptions(
        { label: "Billing & membership", value: "billing" },
        { label: "Account & access", value: "account" },
        { label: "Calls & track record", value: "calls" },
        { label: "Technical issue", value: "technical" },
        { label: "Other", value: "other" }
      )
  );
}

async function ensureOpenTicketHub(client) {
  if (!OPEN_TICKET_CHANNEL_ID) {
    console.log("[discord-bot] open-ticket: channel id not configured, skipping");
    return;
  }

  const channel = await client.channels.fetch(OPEN_TICKET_CHANNEL_ID).catch(() => null);
  if (!channel || !("messages" in channel)) {
    console.warn("[discord-bot] open-ticket: channel not found");
    return;
  }

  const data = await api("/api/discord/open-ticket").catch((e) => {
    console.error("[discord-bot] open-ticket fetch", e);
    return null;
  });
  const markerTitle = data?.markerTitle ?? null;
  const content =
    typeof data?.content === "string" && data.content.trim() ? data.content.trim() : null;
  const rawEmbeds = Array.isArray(data?.embeds) ? data.embeds : [];
  if (!markerTitle || rawEmbeds.length === 0) {
    console.warn("[discord-bot] open-ticket: no hub payload from API");
    return;
  }

  const embeds = rawEmbeds.map((e) => applyEmbedPayload(new EmbedBuilder(), e));
  const payload = {
    ...(content ? { content } : {}),
    embeds,
    components: [openTicketCategoryMenu()],
  };

  const recent = await channel.messages.fetch({ limit: 15 }).catch(() => null);
  const existing = recent?.find(
    (m) =>
      m.author.id === client.user?.id &&
      (m.embeds[0]?.title === markerTitle ||
        m.components.some((row) =>
          row.components.some((c) => c.customId === TICKET_CATEGORY_SELECT_ID)
        ))
  );

  if (existing) {
    await existing.edit(payload).catch(() => null);
    console.log("[discord-bot] updated open-ticket hub");
    return;
  }

  await channel.send(payload);
  console.log("[discord-bot] posted open-ticket hub");
}

const TICKET_CHANNEL_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
];

async function resolveSupportCategoryId(guild) {
  if (SUPPORT_CATEGORY_ID) return SUPPORT_CATEGORY_ID;
  const found = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === "PortFuel Support"
  );
  if (found) return found.id;
  const created = await guild.channels.create({
    name: "PortFuel Support",
    type: ChannelType.GuildCategory,
    reason: "PortFuel support ticket channels",
  });
  console.log(
    `[discord-bot] created support category ${created.id} — set DISCORD_CATEGORY_SUPPORT_ID`
  );
  return created.id;
}

async function handleSupportTicketCreateChannel(payload) {
  const guild = await client.guilds.fetch(String(payload.guildId ?? GUILD_ID));
  const categoryId = payload.categoryId
    ? String(payload.categoryId)
    : await resolveSupportCategoryId(guild);
  const channelName = String(payload.channelName ?? payload.threadName ?? "support").slice(0, 100);

  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    { id: ROLE_ADMIN, allow: TICKET_CHANNEL_PERMS },
    { id: ROLE_MODERATOR, allow: TICKET_CHANNEL_PERMS },
  ];

  const memberDiscordUserId = payload.memberDiscordUserId
    ? String(payload.memberDiscordUserId)
    : null;
  if (memberDiscordUserId) {
    overwrites.push({ id: memberDiscordUserId, allow: TICKET_CHANNEL_PERMS });
  }

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: overwrites,
    reason: `PortFuel support ticket ${payload.ticketId}`,
  });

  const embed = applyEmbedPayload(new EmbedBuilder(), payload.embed);
  const rootMsg = await ticketChannel.send({ embeds: [embed] });

  if (typeof payload.initialMessage === "string" && payload.initialMessage.trim()) {
    await ticketChannel.send({ content: payload.initialMessage.trim().slice(0, 2000) });
  }

  await api(`/api/discord/support/tickets/${payload.ticketId}/discord`, {
    method: "POST",
    body: {
      guildId: guild.id,
      channelId: ticketChannel.id,
      rootMessageId: rootMsg.id,
    },
  });

  console.log(`[discord-bot] support channel ${ticketChannel.id} for ticket ${payload.ticketId}`);
}

async function handleSupportTicketChannelMessage(payload) {
  const channelId = String(payload.channelId ?? payload.threadId ?? "");
  if (!channelId) throw new Error("missing_channel_id");

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel)) throw new Error("channel_not_found");

  const content =
    typeof payload.content === "string" && payload.content.trim()
      ? payload.content.trim().slice(0, 2000)
      : null;

  if (payload.embed && typeof payload.embed === "object") {
    const embed = applyEmbedPayload(new EmbedBuilder(), payload.embed);
    await channel.send({ content: content ?? undefined, embeds: [embed] });
    return;
  }

  if (!content) throw new Error("empty_channel_message");
  await channel.send({ content });
}

async function handleSupportTicketSyncStatus(payload) {
  const channelId = String(payload.channelId ?? payload.threadId ?? "");
  const rootMessageId = String(payload.rootMessageId ?? "");
  if (!channelId || !rootMessageId) throw new Error("missing_channel_refs");

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !("messages" in channel)) throw new Error("ticket_channel_unavailable");

  const rootMsg = await channel.messages.fetch(rootMessageId).catch(() => null);
  if (rootMsg && payload.embed && typeof payload.embed === "object") {
    const embed = applyEmbedPayload(new EmbedBuilder(), payload.embed);
    await rootMsg.edit({ embeds: [embed] }).catch(() => null);
  }

  if (payload.deleteChannel || payload.archive) {
    await channel.delete("Ticket resolved or closed").catch(() => null);
  }
}

async function handleSupportTicketChannelAttachment(payload) {
  const channelId = String(payload.channelId ?? payload.threadId ?? "");
  const signedUrl = String(payload.signedUrl ?? "");
  const fileName = String(payload.fileName ?? "attachment");
  if (!channelId || !signedUrl) throw new Error("missing_attachment_payload");

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel)) throw new Error("channel_not_found");

  const res = await fetch(signedUrl);
  if (!res.ok) throw new Error("attachment_fetch_failed");

  const buf = Buffer.from(await res.arrayBuffer());
  const file = new AttachmentBuilder(buf, { name: fileName.slice(0, 100) });
  await channel.send({
    content: `📎 **Attachment** · ${fileName.slice(0, 200)}`,
    files: [file],
  });
}

function isDiscordSupportStaff(member) {
  if (!member) return false;
  return member.roles.cache.has(ROLE_ADMIN) || member.roles.cache.has(ROLE_MODERATOR);
}

function isLikelyTicketChannel(channel) {
  if (!channel || channel.isDMBased?.() || channel.isThread?.()) return false;
  if (channel.name?.startsWith("pf-")) return true;
  if (SUPPORT_CATEGORY_ID && channel.parentId === SUPPORT_CATEGORY_ID) return true;
  return false;
}

function ticketOpenModal(category) {
  return new ModalBuilder()
    .setCustomId(`${TICKET_OPEN_MODAL_PREFIX}${category}`)
    .setTitle("Open support ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("subject")
          .setLabel("Subject")
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(200)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("message")
          .setLabel("Describe your issue")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(2000)
          .setRequired(true)
      )
    );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once("ready", async () => {
  console.log(`[discord-bot] ready as ${client.user?.tag}`);
  await ensureVerificationMessage(client);
  await ensureOfficialLinksMessage(client);
  await ensureRulesMessage(client);
  await ensureFaqsMessage(client);
  await ensureForumsMessage(client);
  await ensureMemberSupportHub(client);
  await ensureOpenTicketHub(client);
  await registerSlashCommands(client).catch((e) =>
    console.error("[discord-bot] slash register failed", e)
  );
});

client.on("guildMemberAdd", async (member) => {
  if (String(member.guild.id) !== String(GUILD_ID)) return;
  try {
    if (MIN_ACCOUNT_AGE_DAYS > 0) {
      const ageMs = Date.now() - member.user.createdTimestamp;
      const minMs = MIN_ACCOUNT_AGE_DAYS * 86400000;
      if (ageMs < minMs) {
        const daysOld = Math.floor(ageMs / 86400000);
        await member
          .send(
            `Your Discord account must be at least **${MIN_ACCOUNT_AGE_DAYS}** day(s) old to join PortFuel (yours is ~${daysOld} day(s)). Try again later.`
          )
          .catch(() => null);
        await member.kick(`Account younger than ${MIN_ACCOUNT_AGE_DAYS} day(s)`).catch(() => null);
        await botLog(
          client,
          `Anti-raid kick: ${member.user.tag} (account ~${daysOld}d old, min ${MIN_ACCOUNT_AGE_DAYS}d)`
        );
        return;
      }
    }

    if (isRoleId(ROLE_UNVERIFIED)) {
      await member.roles.add(ROLE_UNVERIFIED).catch(() => null);
    }

    const msg =
      `Welcome to PortFuel!\n\n` +
      `Head to <#${VERIFICATION_CHANNEL_ID}> and click **Verify** to get started.\n\n` +
      `PortFuel members: after verifying, click **Link PortFuel** in that channel to connect your subscription.`;

    await member.send({ content: msg }).catch(() => null);
    console.log(`[discord-bot] welcomed ${member.user.id}`);
  } catch (e) {
    console.error("[discord-bot] guildMemberAdd error", e);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (String(interaction.guildId) !== String(GUILD_ID)) return;

  if (interaction.isChatInputCommand() && interaction.commandName === "stats") {
    try {
      await interaction.deferReply({ ephemeral: true });
      const target = interaction.options.getUser("member") ?? interaction.user;
      const stats = await api(
        `/api/discord/member-stats?guildId=${encodeURIComponent(GUILD_ID)}&discordUserId=${encodeURIComponent(target.id)}`
      );
      await interaction.editReply({
        content: formatStatsMessage(stats),
      });
    } catch (e) {
      console.error("[discord-bot] /stats error", e);
      const msg = e instanceof Error ? e.message : "Could not load stats.";
      if (interaction.deferred) {
        await interaction.editReply({ content: msg }).catch(() => null);
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "ticket") {
    const sub = interaction.options.getSubcommand();
    try {
      if (sub === "list") {
        await interaction.deferReply({ ephemeral: true });
        const data = await api(
          `/api/discord/support/tickets/mine?discordUserId=${encodeURIComponent(interaction.user.id)}`
        );
        const items = Array.isArray(data.tickets) ? data.tickets : [];
        if (items.length === 0) {
          await interaction.editReply({
            content:
              "No open tickets. Use **#open-ticket** or open one at portfuel.pro → **Help** → **Tickets**.",
          });
          return;
        }
        const lines = items.map((t) => {
          const channel =
            t.discordChannelId && isRoleId(t.discordChannelId)
              ? ` · <#${t.discordChannelId}>`
              : "";
          return `• **${t.ref}** — ${t.subject} _(${t.status})_${channel}\n  ${t.url}`;
        });
        await interaction.editReply({
          content: `**Your open tickets**\n\n${lines.join("\n")}`,
        });
      }
    } catch (e) {
      console.error("[discord-bot] /ticket error", e);
      const msg = e instanceof Error ? e.message : "Ticket command failed.";
      if (interaction.deferred) {
        await interaction.editReply({ content: msg }).catch(() => null);
      } else if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: msg, ephemeral: true }).catch(() => null);
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === TICKET_CATEGORY_SELECT_ID) {
    try {
      const category = interaction.values[0];
      await interaction.showModal(ticketOpenModal(category));
    } catch (e) {
      console.error("[discord-bot] ticket category select", e);
      const msg = e instanceof Error ? e.message : "Could not open ticket form.";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: msg, ephemeral: true }).catch(() => null);
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith(TICKET_OPEN_MODAL_PREFIX)) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const category = interaction.customId.slice(TICKET_OPEN_MODAL_PREFIX.length);
      const subject = interaction.fields.getTextInputValue("subject").trim();
      const message = interaction.fields.getTextInputValue("message").trim();

      const created = await api("/api/discord/support/tickets/create", {
        method: "POST",
        body: {
          discordUserId: interaction.user.id,
          category,
          subject,
          message,
        },
      });

      const ref = created.ticketNumber ? `PF-${created.ticketNumber}` : "ticket";
      await interaction.editReply({
        content:
          `**${ref}** opened — check your private support channel in Discord and on portfuel.pro.\n\n` +
          `Track: ${APP_URL}/dashboard/help?view=tickets&ticket=${created.id}`,
      });
      await botLog(client, `Ticket ${ref} opened via #open-ticket by ${interaction.user.tag}`);
    } catch (e) {
      console.error("[discord-bot] ticket modal error", e);
      const msg =
        e instanceof Error && e.apiCode === "not_linked"
          ? "Link your PortFuel account in #verification first."
          : e instanceof Error && e.apiCode === "not_active"
            ? "An active PortFuel membership is required for support tickets."
            : e instanceof Error
              ? e.message
              : "Could not open ticket.";
      if (interaction.deferred) {
        await interaction.editReply({ content: msg }).catch(() => null);
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "sync") {
    try {
      await interaction.deferReply({ ephemeral: true });
      const target = interaction.options.getUser("member", true);
      const guild = await client.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(target.id);
      const ent = await api(
        `/api/discord/entitlements?guildId=${encodeURIComponent(GUILD_ID)}&discordUserId=${encodeURIComponent(target.id)}`
      );
      if (!ent.linked) {
        await interaction.editReply({
          content: "That user has not linked PortFuel yet.",
        });
        return;
      }
      await applyEntitlementsToMember(member, ent);
      await api("/api/discord/sync/mark", {
        method: "POST",
        body: { guildId: String(GUILD_ID), discordUserId: target.id },
      });
      await botLog(
        client,
        `Manual /sync by ${interaction.user.tag}: ${target.tag} → active=${ent.isActive} pro=${ent.isPro}`
      );
      await interaction.editReply({
        content: `Synced roles for **${target.username}** (active=${ent.isActive}, pro=${ent.isPro}).`,
      });
    } catch (e) {
      console.error("[discord-bot] /sync error", e);
      const msg = e instanceof Error ? e.message : "Sync failed.";
      if (interaction.deferred) {
        await interaction.editReply({ content: msg }).catch(() => null);
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
      }
    }
    return;
  }

  if (!interaction.isButton()) return;

  const member = interaction.member;
  if (!member || typeof member.roles === "undefined") return;

  try {
    if (interaction.customId === VERIFY_BUTTON_ID) {
      const last = verifyCooldown.get(interaction.user.id) ?? 0;
      if (Date.now() - last < verifyCooldownMs) {
        await interaction.reply({
          content: "Please wait a moment before verifying again.",
          ephemeral: true,
        });
        return;
      }
      verifyCooldown.set(interaction.user.id, Date.now());

      if (isRoleId(ROLE_VERIFIED) && member.roles.cache.has(ROLE_VERIFIED)) {
        await interaction.reply({
          content: "You're already verified.",
          ephemeral: true,
        });
        return;
      }

      await ensureRole(member, ROLE_VERIFIED, true);
      await ensureRole(member, ROLE_UNVERIFIED, false);

      await interaction.reply({
        content:
          "Verified! You now have access to the **Member hub**, **#rules**, **#announcements**, **#general-chat**, and **#fueled-calls**.\n\n" +
          "PortFuel subscriber? Click **Link PortFuel** above to unlock **#member-calls** and member channels.",
        ephemeral: true,
      });
      await api("/api/discord/verify/record", {
        method: "POST",
        body: {
          guildId: String(GUILD_ID),
          discordUserId: String(interaction.user.id),
        },
      }).catch((e) => console.error("[discord-bot] verify record", e));

      await botLog(client, `Verified: ${interaction.user.tag} (${interaction.user.id})`);
      console.log(`[discord-bot] verified ${interaction.user.id}`);
      return;
    }

    if (interaction.customId === LINK_BUTTON_ID) {
      if (isRoleId(ROLE_VERIFIED) && !member.roles.cache.has(ROLE_VERIFIED)) {
        await interaction.reply({
          content: "Please click **Verify** first.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const started = await api("/api/discord/link/start", {
        method: "POST",
        body: {
          guildId: String(GUILD_ID),
          discordUserId: String(interaction.user.id),
        },
      });

      await interaction.editReply({
        content:
          `Link your PortFuel account (log in on the website if needed):\n${started.linkUrl}\n\n` +
          `This link expires in 15 minutes.`,
      });
      console.log(`[discord-bot] link started for ${interaction.user.id}`);
      return;
    }
  } catch (e) {
    console.error("[discord-bot] interaction error", e);
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    if (interaction.deferred) {
      await interaction.editReply({ content: msg }).catch(() => null);
    } else if (interaction.replied) {
      await interaction.followUp({ content: msg, ephemeral: true }).catch(() => null);
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.guild) return;
  if (message.channel.type !== ChannelType.DM) return;

  const content = message.content?.trim() ?? "";
  if (!content) return;

  if (/^(help|hi|hello|start|hey)\b/i.test(content)) {
    await message.reply(HELP_DM_INTRO).catch(() => null);
    return;
  }

  const last = helpDmCooldown.get(message.author.id) ?? 0;
  if (Date.now() - last < helpDmCooldownMs) {
    await message
      .reply("One moment — wait a few seconds between questions.")
      .catch(() => null);
    return;
  }
  helpDmCooldown.set(message.author.id, Date.now());

  if (content.length < 4) {
    await message
      .reply("Ask a PortFuel question in a full sentence (or type **help** for instructions).")
      .catch(() => null);
    return;
  }

  try {
    await message.channel.sendTyping().catch(() => null);
    const result = await api("/api/discord/help-assistant", {
      method: "POST",
      body: {
        guildId: String(GUILD_ID),
        discordUserId: String(message.author.id),
        question: content,
      },
    });

    const answer = typeof result.answer === "string" ? result.answer.trim() : "";
    const disclaimer =
      typeof result.disclaimer === "string" && result.disclaimer.trim()
        ? result.disclaimer.trim()
        : "Answers PortFuel product questions only — not investment advice.";

    if (!answer) {
      throw new Error(
        "PortFuel Help did not return an answer. Try again in a minute or use portfuel.pro/dashboard/help."
      );
    }

    const reply =
      `${answer}\n\n—\n_${disclaimer}_` +
      (typeof result.remaining === "number"
        ? result.mode === "guest"
          ? `\n_Preview questions left: ${result.remaining}_`
          : `\n_Questions left this month: ${result.remaining}_`
        : "");

    await sendDmChunks(message.channel, reply);
    console.log(`[discord-bot] help DM answered for ${message.author.id}`);
  } catch (e) {
    console.error("[discord-bot] help DM error", e);
    const msg =
      e instanceof Error && e.message
        ? e.message
        : "Something went wrong. Try again or use portfuel.pro/dashboard/help.";
    await message.reply(msg).catch(() => null);
  }
});

async function runRoleSyncTick() {
  const pending = await api(
    `/api/discord/sync/pending?guildId=${encodeURIComponent(GUILD_ID)}&limit=50`
  );
  const items = Array.isArray(pending.items) ? pending.items : [];
  if (items.length === 0) return;

  const guild = await client.guilds.fetch(GUILD_ID);

  for (const item of items) {
    const discordUserId = String(item.discordUserId);
    const isActive = Boolean(item.isActive);
    const isPro = Boolean(item.isPro);

    const member = await guild.members.fetch(discordUserId).catch(() => null);
    if (!member) continue;

    await applyEntitlementsToMember(member, {
      linked: true,
      isActive,
      isPro,
    });

    await api("/api/discord/sync/mark", {
      method: "POST",
      body: { guildId: String(GUILD_ID), discordUserId },
    });

    console.log(
      `[discord-bot] synced roles for ${discordUserId} (active=${isActive} pro=${isPro})`
    );
  }
}

function formatOutboxEvent(eventType, payload) {
  if (payload?.embed) return null;
  if (typeof payload?.text === "string" && payload.text.trim()) return payload.text.trim();
  if (eventType === "call.created" || eventType === "call.created.fueled") {
    const sym = payload?.symbol ?? "—";
    const dir = payload?.direction ?? "";
    const fueled = payload?.isFueled ? " 🔥 **FUELED**" : "";
    const by = payload?.by ?? "someone";
    const url = payload?.url ? `\n${payload.url}` : "";
    return `New call${fueled}: **${sym}** ${dir} — by ${by}${url}`;
  }
  if (eventType === "call.target_hit") {
    const sym = payload?.symbol ?? "—";
    const pct = payload?.returnPct != null ? ` (${payload.returnPct}%)` : "";
    const by = payload?.by ? ` — ${payload.by}` : "";
    const url = payload?.url ? `\n${payload.url}` : "";
    return `🎯 Target hit: **${sym}**${pct}${by}${url}`;
  }
  return `Event: ${eventType}\n` + "```json\n" + JSON.stringify(payload ?? {}, null, 2) + "\n```";
}

async function runLinkReminderTick() {
  const due = await api(
    `/api/discord/link/reminders-due?guildId=${encodeURIComponent(GUILD_ID)}&hours=24&limit=20`
  );
  const items = Array.isArray(due.items) ? due.items : [];
  if (items.length === 0) return;

  for (const item of items) {
    const discordUserId = String(item.discordUserId);
    try {
      const user = await client.users.fetch(discordUserId);
      const msg =
        `Hey — you verified in PortFuel Discord but haven't linked your PortFuel account yet.\n\n` +
        `Go to <#${VERIFICATION_CHANNEL_ID}> and click **Link PortFuel** (while logged in at portfuel.pro) to unlock member channels.`;

      await user.send({ content: msg }).catch(() => null);
      await api("/api/discord/link/mark-reminded", {
        method: "POST",
        body: { guildId: String(GUILD_ID), discordUserId },
      });
      console.log(`[discord-bot] link reminder sent to ${discordUserId}`);
    } catch (e) {
      console.error(`[discord-bot] link reminder failed ${discordUserId}`, e);
    }
  }
}

async function runOutboxTick() {
  const pulled = await api("/api/discord/outbox/pull", {
    method: "POST",
    body: { guildId: String(GUILD_ID), limit: 5, workerId: WORKER_ID },
  });
  const items = Array.isArray(pulled.items) ? pulled.items : [];
  if (items.length === 0) return;

  for (const item of items) {
    const id = String(item.id);
    const eventType = String(item.eventType);
    const payload = item.payload ?? {};
    const channelId = String(item.channelId);

    try {
      if (channelId === "dm" || eventType === "member.dm") {
        const discordUserId = String(payload.discordUserId ?? "");
        const text = String(payload.text ?? "");
        if (!discordUserId || !text) throw new Error("invalid_dm_payload");
        const user = await client.users.fetch(discordUserId).catch(() => null);
        if (!user) throw new Error("user_not_found");
        await user.send({ content: text });
        await api("/api/discord/outbox/ack", { method: "POST", body: { id, status: "sent" } });
        console.log(`[discord-bot] sent DM to ${discordUserId}`);
        continue;
      }

      if (
        eventType === "support.ticket.create_channel" ||
        eventType === "support.ticket.create_thread"
      ) {
        await handleSupportTicketCreateChannel(payload);
        await api("/api/discord/outbox/ack", { method: "POST", body: { id, status: "sent" } });
        console.log(`[discord-bot] created support channel for outbox ${id}`);
        continue;
      }

      if (
        eventType === "support.ticket.channel_message" ||
        eventType === "support.ticket.thread_message"
      ) {
        await handleSupportTicketChannelMessage(payload);
        await api("/api/discord/outbox/ack", { method: "POST", body: { id, status: "sent" } });
        console.log(`[discord-bot] channel message for outbox ${id}`);
        continue;
      }

      if (eventType === "support.ticket.sync_status") {
        await handleSupportTicketSyncStatus(payload);
        await api("/api/discord/outbox/ack", { method: "POST", body: { id, status: "sent" } });
        console.log(`[discord-bot] synced ticket status for outbox ${id}`);
        continue;
      }

      if (
        eventType === "support.ticket.channel_attachment" ||
        eventType === "support.ticket.thread_attachment"
      ) {
        await handleSupportTicketChannelAttachment(payload);
        await api("/api/discord/outbox/ack", { method: "POST", body: { id, status: "sent" } });
        console.log(`[discord-bot] channel attachment for outbox ${id}`);
        continue;
      }

      const resolvedChannel =
        channelId === "calls"
          ? CALLS_CHANNEL_ID
          : channelId === "targets"
            ? TARGETS_CHANNEL_ID
            : channelId === "member"
              ? MEMBER_CHAT_CHANNEL_ID
              : channelId === "pro"
                ? PRO_MEMBER_CHAT_CHANNEL_ID
                : channelId;

      const messagePayload = payload?.embed ? payload : { text: formatOutboxEvent(eventType, payload) };
      if (!messagePayload.embed && !messagePayload.text) {
        throw new Error("empty_outbox_payload");
      }

      await postToChannel(client, resolvedChannel, messagePayload, {
        attachChart: Boolean(payload.attachChart),
        callId: payload.callId ? String(payload.callId) : undefined,
        milestone: payload.milestone ? String(payload.milestone) : undefined,
        symbol: payload.symbol ? String(payload.symbol) : undefined,
      });
      await api("/api/discord/outbox/ack", { method: "POST", body: { id, status: "sent" } });
      console.log(`[discord-bot] sent outbox ${id} -> ${resolvedChannel}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "send_failed";
      await api("/api/discord/outbox/ack", {
        method: "POST",
        body: { id, status: "failed", error: msg.slice(0, 2000) },
      }).catch(() => null);
      console.error(`[discord-bot] failed outbox ${id}`, e);
    }
  }
}

const supportChannelReplyCooldown = new Map();

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (!isLikelyTicketChannel(message.channel)) return;

    const body = message.content?.trim() ?? "";
    if (!body) return;

    const last = supportChannelReplyCooldown.get(message.id) ?? 0;
    if (last) return;
    supportChannelReplyCooldown.set(message.id, Date.now());
    setTimeout(() => supportChannelReplyCooldown.delete(message.id), 60_000);

    const lookup = await api(
      `/api/discord/support/tickets/by-channel?channelId=${encodeURIComponent(message.channel.id)}`
    );
    const ticketId = lookup?.ticket?.id;
    if (!ticketId) return;

    const member = message.member ?? (await message.guild?.members.fetch(message.author.id).catch(() => null));
    const discordStaff = isDiscordSupportStaff(member);

    await api(`/api/discord/support/tickets/${ticketId}/reply`, {
      method: "POST",
      body: {
        discordUserId: message.author.id,
        body,
        discordStaff,
      },
    });

    await message.react("✅").catch(() => null);
    console.log(`[discord-bot] synced channel reply ${message.id} -> ticket ${ticketId}`);
  } catch (e) {
    if (e instanceof Error && (e.apiCode === "forbidden" || e.apiCode === "ticket_closed")) {
      await message.react("⛔").catch(() => null);
      return;
    }
    console.error("[discord-bot] support channel sync", e);
    await message.react("⚠️").catch(() => null);
  }
});

async function main() {
  await client.login(DISCORD_TOKEN);

  setInterval(() => {
    runRoleSyncTick().catch((e) => console.error("[discord-bot] role sync tick", e));
  }, 20_000);

  setInterval(() => {
    runOutboxTick().catch((e) => console.error("[discord-bot] outbox tick", e));
  }, 5_000);

  setInterval(() => {
    runLinkReminderTick().catch((e) => console.error("[discord-bot] link reminder tick", e));
  }, 60 * 60 * 1000);

  void runLinkReminderTick().catch(() => null);
}

main().catch((e) => {
  console.error("[discord-bot] fatal", e);
  process.exit(1);
});
