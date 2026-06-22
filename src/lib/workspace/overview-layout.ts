export type OverviewPanelId =
  | "hero"
  | "stats"
  | "activity"
  | "open_calls"
  | "track_record"
  | "live_bar"
  | "journal_nudge"
  | "book_posture"
  | "pro_command"
  | "fueled_desk"
  | "member_feed"
  | "following"
  | "watchlist"
  | "fueled_portfolio"
  | "fueled_track_record"
  | "journal_pulse"
  | "alerts_email"
  | "onboarding"
  | "referral"
  | "pro_strip";

export type OverviewFocusMode = "default" | "trader" | "researcher" | "publisher";

export type OverviewDensity = "comfortable" | "compact";

export type OverviewLayoutPrefs = {
  focus: OverviewFocusMode;
  /** Explicit show/hide overrides on top of focus presets. */
  panelOverrides: Partial<Record<OverviewPanelId, boolean>>;
  density: OverviewDensity;
  version: 1 | 2 | 3;
};

export const OVERVIEW_LAYOUT_VERSION = 3 as const;

export const OVERVIEW_LAYOUT_STORAGE_PREFIX = "pf_overview_layout:";
export const OVERVIEW_LAYOUT_OPEN_EVENT = "portfuel:open-overview-layout";
export const OVERVIEW_LAYOUT_CHANGED_EVENT = "portfuel:overview-layout-changed";

export const OVERVIEW_PANEL_LABELS: Record<OverviewPanelId, string> = {
  hero: "Return hero",
  stats: "Workspace stats",
  activity: "Hot tickers & pulse",
  open_calls: "Open calls",
  track_record: "Share track record",
  live_bar: "Live workspace bar",
  journal_nudge: "Journal nudge",
  book_posture: "Book posture",
  pro_command: "Pro command center",
  fueled_desk: "Fueled desk preview",
  member_feed: "Member feed",
  following: "Following feed",
  watchlist: "Watchlist preview",
  fueled_portfolio: "Fueled portfolio",
  fueled_track_record: "Fueled track record",
  journal_pulse: "Journal ideas pulse",
  alerts_email: "Email alerts setup",
  onboarding: "Onboarding checklist",
  referral: "Referral invite",
  pro_strip: "Pro upgrade strip",
};

export const OVERVIEW_FOCUS_LABELS: Record<OverviewFocusMode, string> = {
  default: "Default",
  trader: "Trader",
  researcher: "Researcher",
  publisher: "Publisher",
};

export const OVERVIEW_FOCUS_DESCRIPTIONS: Record<
  Exclude<OverviewFocusMode, "default">,
  string
> = {
  trader: "Book, open calls, and live quotes — less community noise.",
  researcher: "Watchlist, journal, and ideas — less desk marketing.",
  publisher: "Publish flow, track record, and growth — less feed clutter.",
};

/** Panels hidden by each focus preset (default shows all unless overridden). */
export const FOCUS_PRESET_HIDDEN: Record<
  Exclude<OverviewFocusMode, "default">,
  OverviewPanelId[]
> = {
  trader: [
    "activity",
    "stats",
    "track_record",
    "live_bar",
    "book_posture",
    "fueled_desk",
    "member_feed",
    "following",
    "watchlist",
    "fueled_portfolio",
    "fueled_track_record",
    "journal_pulse",
    "onboarding",
    "referral",
    "alerts_email",
    "pro_strip",
  ],
  researcher: [
    "fueled_desk",
    "fueled_portfolio",
    "fueled_track_record",
    "pro_strip",
    "track_record",
  ],
  publisher: [
    "activity",
    "member_feed",
    "following",
    "fueled_desk",
    "fueled_portfolio",
    "fueled_track_record",
    "pro_command",
  ],
};

export const ALL_OVERVIEW_PANEL_IDS = Object.keys(OVERVIEW_PANEL_LABELS) as OverviewPanelId[];

export function isMobileOverviewViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

export function defaultOverviewLayoutPrefs(options?: {
  mobile?: boolean;
  isPro?: boolean;
}): OverviewLayoutPrefs {
  return {
    focus: options?.isPro ? "researcher" : "trader",
    panelOverrides: {},
    density: options?.mobile ? "compact" : "comfortable",
    version: OVERVIEW_LAYOUT_VERSION,
  };
}

function normalizeOverviewLayoutPrefs(parsed: Partial<OverviewLayoutPrefs>): OverviewLayoutPrefs {
  return {
    focus: parsed.focus ?? "default",
    panelOverrides: parsed.panelOverrides ?? {},
    density: parsed.density === "compact" ? "compact" : "comfortable",
    version: OVERVIEW_LAYOUT_VERSION,
  };
}

function shouldMigrateToTraderPreset(parsed: Partial<OverviewLayoutPrefs>): boolean {
  const focus = parsed.focus ?? "default";
  const overrides = parsed.panelOverrides ?? {};
  return focus === "default" && Object.keys(overrides).length === 0;
}

export function overviewLayoutStorageKey(userId: string): string {
  return `${OVERVIEW_LAYOUT_STORAGE_PREFIX}${userId}`;
}

export function isOverviewPanelVisible(
  panelId: OverviewPanelId,
  prefs: OverviewLayoutPrefs
): boolean {
  const override = prefs.panelOverrides[panelId];
  if (override !== undefined) return override;
  if (prefs.focus === "default") return true;
  return !FOCUS_PRESET_HIDDEN[prefs.focus].includes(panelId);
}

export function readOverviewLayoutPrefs(
  userId: string,
  options?: { isPro?: boolean }
): OverviewLayoutPrefs {
  if (typeof window === "undefined") {
    return defaultOverviewLayoutPrefs({ isPro: options?.isPro });
  }
  try {
    const raw = window.localStorage.getItem(overviewLayoutStorageKey(userId));
    const mobile = isMobileOverviewViewport();
    if (!raw) {
      const defaults = defaultOverviewLayoutPrefs({ mobile, isPro: options?.isPro });
      writeOverviewLayoutPrefs(userId, defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<OverviewLayoutPrefs>;
    if (
      (parsed.version ?? 1) < OVERVIEW_LAYOUT_VERSION &&
      shouldMigrateToTraderPreset(parsed)
    ) {
      const migrated = defaultOverviewLayoutPrefs({ mobile, isPro: options?.isPro });
      writeOverviewLayoutPrefs(userId, migrated);
      return migrated;
    }
    const normalized = normalizeOverviewLayoutPrefs(parsed);
    if (parsed.version !== OVERVIEW_LAYOUT_VERSION) {
      writeOverviewLayoutPrefs(userId, normalized);
    }
    return normalized;
  } catch {
    return defaultOverviewLayoutPrefs();
  }
}

export function writeOverviewLayoutPrefs(userId: string, prefs: OverviewLayoutPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(overviewLayoutStorageKey(userId), JSON.stringify(prefs));
}

export function dispatchOverviewLayoutOpen(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("pf_overview_layout_open", "1");
    window.dispatchEvent(new Event(OVERVIEW_LAYOUT_OPEN_EVENT));
  }
}

export function dispatchOverviewLayoutChanged(): void {
  window.dispatchEvent(new Event(OVERVIEW_LAYOUT_CHANGED_EVENT));
}
