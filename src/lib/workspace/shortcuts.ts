export type WorkspaceShortcut = {
  keys: string[];
  label: string;
  description: string;
};

export type WorkspaceShortcutGroup = {
  title: string;
  items: WorkspaceShortcut[];
};

export const WORKSPACE_SHORTCUT_GROUPS: WorkspaceShortcutGroup[] = [
  {
    title: "Global",
    items: [
      {
        keys: ["⌘", "K"],
        label: "Search workspace",
        description: "Symbols, members, pages, headlines, journal — plus quick actions.",
      },
      {
        keys: ["?"],
        label: "Keyboard shortcuts",
        description: "Open this reference from anywhere in the workspace.",
      },
      {
        keys: ["Esc"],
        label: "Close overlay",
        description: "Dismiss search, shortcuts, modals, and drawers.",
      },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["G", "H"], label: "Overview", description: "Home dashboard." },
      { keys: ["G", "B"], label: "Positions", description: "Your live calls and open-position P&L." },
      { keys: ["G", "F"], label: "Member feed", description: "Community call board." },
      { keys: ["G", "D"], label: "Fueled desk", description: "House research and portfolio." },
      { keys: ["G", "W"], label: "Watchlist", description: "Symbols and alerts." },
      { keys: ["G", "J"], label: "Journal", description: "Private research notebook." },
      { keys: ["G", "R"], label: "Pro research", description: "Screener, earnings, compare." },
      { keys: ["G", "U"], label: "What's new", description: "Release notes and product updates." },
    ],
  },
  {
    title: "Command palette",
    items: [
      {
        keys: ["⌘", "K"],
        label: "Open command palette",
        description: "Search plus actions: publish call, mark alerts read, theme, refresh positions.",
      },
      {
        keys: ["type"],
        label: "Run by name",
        description: 'Try "publish", "dark mode", "mark read", or "add NVDA".',
      },
    ],
  },
  {
    title: "Actions",
    items: [
      {
        keys: ["N", "C"],
        label: "Publish call",
        description: "New thesis with entry, target, and stop.",
      },
      {
        keys: ["G", "S"],
        label: "Settings",
        description: "Billing, alerts, and account preferences.",
      },
      {
        keys: ["G", "P"],
        label: "Help center",
        description: "Docs, troubleshooting, and support tickets.",
      },
    ],
  },
];

/** Windows/Linux display — swap ⌘ for Ctrl in UI when needed. */
export function shortcutKeysForPlatform(keys: string[]): string[] {
  if (typeof navigator === "undefined") return keys;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  return keys.map((k) => (k === "⌘" && !isMac ? "Ctrl" : k));
}

export const WORKSPACE_GOTO_ROUTES: Record<string, string> = {
  h: "/dashboard",
  b: "/dashboard/book",
  f: "/dashboard/feed",
  d: "/dashboard/desk",
  w: "/dashboard/watchlist",
  j: "/dashboard/journal",
  r: "/dashboard/research",
  u: "/dashboard/whats-new",
  s: "/dashboard/settings",
  p: "/dashboard/help",
};

export const WORKSPACE_SHORTCUTS_OPEN_EVENT = "pf:open-workspace-shortcuts";

export const WORKSPACE_ACTION_ROUTES: Record<string, string> = {
  c: "/calls/new",
};
