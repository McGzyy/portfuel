export type XPostType =
  | "fueled"
  | "leaderboard"
  | "fueled_milestone"
  | "member_win"
  | "member_win_update";

export type XConfig = {
  enabled: boolean;
  dryRun: boolean;
  bearerToken: string | null;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
  memberWinPosts: boolean;
  autopostFueledOnPublish: boolean;
  autopostMilestones: boolean;
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
    memberWinPosts: envFlag("X_POST_MEMBER_WINS", false),
    autopostFueledOnPublish: envFlag("X_AUTOPOST_FUELED_ON_PUBLISH", false),
    autopostMilestones: !["0", "false", "no"].includes(
      (process.env.X_AUTOPOST_MILESTONES ?? "true").trim().toLowerCase()
    ),
  };
}

export function isXConfigured(): boolean {
  const c = getXConfig();
  return c.enabled && Boolean(c.bearerToken);
}

export function xConfigSummary(): {
  enabled: boolean;
  dryRun: boolean;
  /** Token present (inbound URL fetch + outbound API). */
  bearerTokenSet: boolean;
  /** Live post to X: enabled + token + not dry run. */
  livePostingReady: boolean;
  /** @deprecated Use bearerTokenSet / livePostingReady — kept for API compat. */
  configured: boolean;
  fueledPosts: boolean;
  leaderboardPosts: boolean;
  memberWinPosts: boolean;
  autopostFueledOnPublish: boolean;
} {
  const c = getXConfig();
  const bearerTokenSet = Boolean(c.bearerToken);
  const livePostingReady = c.enabled && bearerTokenSet && !c.dryRun;
  return {
    enabled: c.enabled,
    dryRun: c.dryRun,
    bearerTokenSet,
    livePostingReady,
    configured: isXConfigured(),
    fueledPosts: c.fueledPosts,
    leaderboardPosts: c.leaderboardPosts,
    memberWinPosts: c.memberWinPosts,
    autopostFueledOnPublish: c.autopostFueledOnPublish,
  };
}
