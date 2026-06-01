import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Partials,
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
const CALLS_CHANNEL_ID = process.env.DISCORD_CHANNEL_CALLS_ID ?? "1510841810430197991";
const TARGETS_CHANNEL_ID = process.env.DISCORD_CHANNEL_TARGETS_ID ?? "1510842222143340707";

const VERIFY_BUTTON_ID = "pf:verify";
const LINK_BUTTON_ID = "pf:link";

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${APP_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-portfuel-bot-key": BOT_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error ? String(json.error) : `${res.status}`;
    throw new Error(`API ${method} ${path} failed: ${msg}`);
  }
  return json;
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

async function postToChannel(client, channelId, content) {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel)) throw new Error("channel_unavailable");
  await channel.send({ content });
}

function verificationEmbed() {
  return new EmbedBuilder()
    .setTitle("Welcome to PortFuel")
    .setDescription(
      "**Step 1 — Verify**\n" +
        "Click **Verify** below to confirm you're human and unlock basic channels.\n\n" +
        "**Step 2 — Link PortFuel (members only)**\n" +
        "Already subscribed on [portfuel.pro](https://www.portfuel.pro)? Click **Link PortFuel** " +
        "while logged into your dashboard, then complete the link in your browser.\n\n" +
        "Member and Pro channels unlock after your PortFuel subscription is linked."
    )
    .setColor(0xe11d48)
    .setFooter({ text: "PortFuel Verification" });
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

async function ensureVerificationMessage(client) {
  const channel = await client.channels.fetch(VERIFICATION_CHANNEL_ID).catch(() => null);
  if (!channel || !("messages" in channel)) {
    console.warn("[discord-bot] verification channel not found");
    return;
  }

  const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  const existing = recent?.find(
    (m) =>
      m.author.id === client.user?.id &&
      m.components.some((row) =>
        row.components.some((c) => c.customId === VERIFY_BUTTON_ID)
      )
  );

  if (existing) {
    await existing.edit({ embeds: [verificationEmbed()], components: [verificationButtons()] }).catch(() => null);
    console.log("[discord-bot] updated verification message");
    return;
  }

  await channel.send({ embeds: [verificationEmbed()], components: [verificationButtons()] });
  console.log("[discord-bot] posted verification message");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.once("ready", async () => {
  console.log(`[discord-bot] ready as ${client.user?.tag}`);
  await ensureVerificationMessage(client);
});

client.on("guildMemberAdd", async (member) => {
  if (String(member.guild.id) !== String(GUILD_ID)) return;
  try {
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
  if (!interaction.isButton()) return;
  if (String(interaction.guildId) !== String(GUILD_ID)) return;

  const member = interaction.member;
  if (!member || typeof member.roles === "undefined") return;

  try {
    if (interaction.customId === VERIFY_BUTTON_ID) {
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
          "Verified! You can now see **#official-links**, **#announcements**, **#general-chat**, and **#fire-calls**.\n\n" +
          "PortFuel subscriber? Click **Link PortFuel** above to unlock member channels.",
        ephemeral: true,
      });
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

      const started = await api("/api/discord/link/start", {
        method: "POST",
        body: {
          guildId: String(GUILD_ID),
          discordUserId: String(interaction.user.id),
        },
      });

      await interaction.reply({
        content:
          `Link your PortFuel account (log in on the website if needed):\n${started.linkUrl}\n\n` +
          `This link expires in 15 minutes.`,
        ephemeral: true,
      });
      console.log(`[discord-bot] link started for ${interaction.user.id}`);
    }
  } catch (e) {
    console.error("[discord-bot] interaction error", e);
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: msg, ephemeral: true }).catch(() => null);
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
    }
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

    // Paid access only — human Verified role is managed separately.
    await ensureRole(member, ROLE_MEMBER, isActive);
    await ensureRole(member, ROLE_PRO, isPro);

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
  if (typeof payload?.text === "string" && payload.text.trim()) return payload.text.trim();
  if (eventType === "call.created") {
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
      const resolvedChannel =
        channelId === "calls"
          ? CALLS_CHANNEL_ID
          : channelId === "targets"
            ? TARGETS_CHANNEL_ID
            : channelId;

      const content = formatOutboxEvent(eventType, payload);
      await postToChannel(client, resolvedChannel, content);
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

async function main() {
  await client.login(DISCORD_TOKEN);

  setInterval(() => {
    runRoleSyncTick().catch((e) => console.error("[discord-bot] role sync tick", e));
  }, 20_000);

  setInterval(() => {
    runOutboxTick().catch((e) => console.error("[discord-bot] outbox tick", e));
  }, 5_000);
}

main().catch((e) => {
  console.error("[discord-bot] fatal", e);
  process.exit(1);
});
