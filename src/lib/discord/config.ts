/** Discord IDs — override via env when channels/roles change. */
export function getDiscordConfig() {
  const guildId = process.env.DISCORD_GUILD_ID ?? "1508150607285063850";

  return {
    guildId,
    enabled: process.env.DISCORD_NOTIFICATIONS_ENABLED !== "false" && Boolean(guildId),
    roles: {
      unverified: process.env.DISCORD_ROLE_UNVERIFIED_ID ?? "1510855393184714893",
      verified: process.env.DISCORD_ROLE_VERIFIED_ID ?? "1510805030666506311",
      member: process.env.DISCORD_ROLE_MEMBER_ID ?? "1510805558569992272",
      pro: process.env.DISCORD_ROLE_PRO_ID ?? "1510805852154757190",
    },
    channels: {
      verification: process.env.DISCORD_CHANNEL_VERIFICATION_ID ?? "1510828920487022652",
      officialLinks: process.env.DISCORD_CHANNEL_OFFICIAL_LINKS_ID ?? "1510828840161771631",
      announcements: process.env.DISCORD_CHANNEL_ANNOUNCEMENTS_ID ?? "1510841366777823352",
      generalChat: process.env.DISCORD_CHANNEL_GENERAL_CHAT_ID ?? "1508150608106881026",
      fireCalls: process.env.DISCORD_CHANNEL_FIRE_CALLS_ID ?? "1510860334628602027",
      calls: process.env.DISCORD_CHANNEL_CALLS_ID ?? "1510841810430197991",
      targets: process.env.DISCORD_CHANNEL_TARGETS_ID ?? "1510842222143340707",
      memberChat: process.env.DISCORD_CHANNEL_MEMBER_CHAT_ID ?? "1510799917415923763",
      proMemberChat: process.env.DISCORD_CHANNEL_PRO_MEMBER_CHAT_ID ?? "1510799989213757460",
      botLog: process.env.DISCORD_CHANNEL_BOT_LOG_ID ?? "",
    },
  };
}

export type DiscordConfig = ReturnType<typeof getDiscordConfig>;
