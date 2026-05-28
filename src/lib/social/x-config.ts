export type XPostType = "fueled" | "leaderboard";

export type XConfig = {
  enabled: boolean;
  dryRun: boolean;
  bearerToken: string | null;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
  autopostFueledOnPublish: boolean;
};

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes";
}

export function getXConfig(): XConfig {
  const bearerToken = process.env.X_API_BEARER_TOKEN?.trim() || null;
  const enabled = envFlag("X_API_ENABLED");
  const dryRun = envFlag("X_API_DRY_RUN", true);

  return {
    enabled,
    dryRun,
    bearerToken,
    fueledPosts: envFlag("X_POST_FUELED", true),
    leaderboardPosts: envFlag("X_POST_LEADERBOARD", true),
    autopostFueledOnPublish: envFlag("X_AUTOPOST_FUELED_ON_PUBLISH", false),
  };
}

export function isXConfigured(): boolean {
  const c = getXConfig();
  return c.enabled && Boolean(c.bearerToken);
}

export function xConfigSummary(): {
  enabled: boolean;
  dryRun: boolean;
  configured: boolean;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
  autopostFueledOnPublish: boolean;
} {
  const c = getXConfig();
  return {
    enabled: c.enabled,
    dryRun: c.dryRun,
    configured: isXConfigured(),
    fueledPosts: c.fueledPosts,
    leaderboardPosts: c.leaderboardPosts,
    autopostFueledOnPublish: c.autopostFueledOnPublish,
  };
}
